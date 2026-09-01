import nodemailer, { type SendMailOptions } from 'nodemailer'

export interface TransactionalEmailAttachment {
  filename: string
  content: string
  contentType?: string
}

export interface TransactionalEmailPayload {
  from?: string
  to: string[]
  subject: string
  html: string
  attachments?: TransactionalEmailAttachment[]
}

export interface MailSendResult {
  ok: boolean
  provider?: 'smtp' | 'log'
  status?: number
  responseText?: string
  error?: unknown
}

export const DEFAULT_TRANSACTIONAL_EMAIL_ADDRESS = 'orders@phonicsclub.com'
export const DEFAULT_TRANSACTIONAL_EMAIL_FROM = `Phonics Club <${DEFAULT_TRANSACTIONAL_EMAIL_ADDRESS}>`

interface CompleteTransactionalEmailPayload extends TransactionalEmailPayload {
  from: string
}

interface MimeLineRecord {
  bytes: number
  lineNumber: number
  part: string
  section: 'headers' | 'body' | 'boundary'
  contentType?: string
  transferEncoding?: string
  contentDisposition?: string
}

export interface MimeLineDiagnostics {
  maxLineBytes: number
  linesOver998: number
  linesOver2048: number
  longestLine: MimeLineRecord
}

type HeaderMap = Record<string, string>

function cleanEnv(value: string | undefined) {
  const trimmed = String(value ?? '').trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

function envValue(...keys: string[]) {
  for (const key of keys) {
    const value = cleanEnv(process.env[key])
    if (value) return value
  }
  return ''
}

function smtpHost() {
  return envValue('SMTP_HOST', 'ORDER_SMTP_HOST', 'EMAIL_SMTP_HOST')
}

function smtpUser() {
  return envValue('SMTP_USER', 'SMTP_USERNAME', 'ORDER_EMAIL_USER')
}

function smtpPassword() {
  return envValue('SMTP_PASSWORD', 'SMTP_PASS', 'ORDER_EMAIL_PASSWORD')
}

function smtpEhloDomain() {
  return envValue('SMTP_EHLO_DOMAIN') || 'phonicsclub.com'
}

function smtpAuthMethod() {
  return envValue('SMTP_AUTH_METHOD') || 'LOGIN'
}

function defaultFrom() {
  const configuredFrom = envValue('ORDER_EMAIL_FROM')
  const user = smtpUser()
  if (configuredFrom) return configuredFrom
  if (isLikelyEmailAddress(user)) return `Phonics Club <${user}>`
  return DEFAULT_TRANSACTIONAL_EMAIL_FROM
}

function isLikelyEmailAddress(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function senderEmailAddress(value: string) {
  const angleAddress = value.match(/<([^<>]+)>/)?.[1]?.trim()
  return (angleAddress || value).replace(/^mailto:/i, '').trim()
}

function senderDisplayName(value: string) {
  const match = value.match(/^(.*?)<[^<>]+>/)
  const displayName = match?.[1]?.trim().replace(/^"|"$/g, '')
  return displayName || 'Phonics Club'
}

function senderDomain(value: string) {
  const address = senderEmailAddress(value)
  return address.includes('@') ? address.split('@').pop()?.toLowerCase() : undefined
}

function mailbox(displayName: string, address: string) {
  const safeDisplay = displayName.replace(/[\r\n"<>]+/g, ' ').replace(/\s+/g, ' ').trim()
  return safeDisplay ? `${safeDisplay} <${address}>` : address
}

function shouldAllowDifferentSender() {
  return ['1', 'true', 'yes'].includes(envValue('SMTP_ALLOW_DIFFERENT_FROM').toLowerCase())
}

function alignSenderWithAuthenticatedMailbox(from: string) {
  const user = smtpUser()
  if (!isLikelyEmailAddress(user) || shouldAllowDifferentSender()) return from

  const requestedAddress = senderEmailAddress(from)
  if (!isLikelyEmailAddress(requestedAddress)) return from
  if (requestedAddress.toLowerCase() === user.toLowerCase()) return from

  const adjusted = mailbox(senderDisplayName(from), user)
  console.warn('[Email SMTP] Sender address adjusted to authenticated mailbox', {
    requestedSenderDomain: senderDomain(from),
    smtpUserDomain: senderDomain(user),
    orderEmailFromConfigured: Boolean(envValue('ORDER_EMAIL_FROM')),
  })
  return adjusted
}

function normalizeRecipients(recipients: string[]) {
  const seen = new Set<string>()
  const valid: string[] = []
  const invalid: string[] = []

  for (const recipient of recipients) {
    const email = recipient.trim()
    if (!email) continue
    if (!isLikelyEmailAddress(email)) {
      invalid.push(email)
      continue
    }

    const key = email.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    valid.push(email)
  }

  return { valid, invalid }
}

function smtpLogContext(payload: TransactionalEmailPayload) {
  const user = smtpUser()
  return {
    smtpHost: smtpHost() || '[missing]',
    smtpPort: envValue('SMTP_PORT') || '465',
    smtpSecure: envValue('SMTP_SECURE') || 'true',
    smtpEhloDomain: smtpEhloDomain(),
    smtpAuthMethod: smtpAuthMethod(),
    smtpUserDomain: user.includes('@') ? user.split('@').pop() : user ? '[configured]' : '[missing]',
    orderEmailFromConfigured: Boolean(envValue('ORDER_EMAIL_FROM')),
    recipientCount: payload.to.length,
    attachmentCount: payload.attachments?.length ?? 0,
    rawHtmlMaxLineBytes: maxLineBytes(payload.html),
    subject: payload.subject,
  }
}

function missingSmtpSettings() {
  return [
    ['SMTP_HOST', smtpHost()],
    ['SMTP_USER', smtpUser()],
    ['SMTP_PASSWORD or SMTP_PASS', smtpPassword()],
  ]
    .filter(([, value]) => !String(value ?? '').trim())
    .map(([key]) => key)
}

function maxLineBytes(value: string) {
  return value
    .split(/\r?\n/)
    .reduce((max, line) => Math.max(max, Buffer.byteLength(line, 'utf8')), 0)
}

function decodeBase64Attachment(attachment: TransactionalEmailAttachment) {
  return Buffer.from(attachment.content.replace(/\s/g, ''), 'base64')
}

function truncateUtf8(value: string, maxBytes: number) {
  let result = ''
  for (const char of value) {
    if (Buffer.byteLength(`${result}${char}`, 'utf8') > maxBytes) break
    result += char
  }
  return result
}

function safeAttachmentFilename(filename: string) {
  const cleaned = filename.replace(/[\r\n"<>]+/g, '_').trim() || 'attachment'
  const maxBytes = 120
  if (Buffer.byteLength(cleaned, 'utf8') <= maxBytes) return cleaned

  const extensionMatch = cleaned.match(/(\.[A-Za-z0-9]{1,10})$/)
  const extension = extensionMatch?.[1] ?? ''
  const base = extension ? cleaned.slice(0, -extension.length) : cleaned
  const maxBaseBytes = Math.max(1, maxBytes - Buffer.byteLength(extension, 'utf8'))
  return `${truncateUtf8(base, maxBaseBytes) || 'attachment'}${extension}`
}

function buildMailOptions(payload: CompleteTransactionalEmailPayload): SendMailOptions {
  return {
    from: payload.from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    textEncoding: 'quoted-printable',
    disableFileAccess: true,
    disableUrlAccess: true,
    attachments: payload.attachments?.map((attachment) => ({
      filename: safeAttachmentFilename(attachment.filename),
      content: decodeBase64Attachment(attachment),
      contentType: attachment.contentType ?? 'application/pdf',
      contentTransferEncoding: 'base64',
      contentDisposition: 'attachment',
    })),
  }
}

function describeMimePart(partIndex: number, headers: HeaderMap) {
  const contentType = headers['content-type']
  const contentDisposition = headers['content-disposition']
  const transferEncoding = headers['content-transfer-encoding']
  const contentTypeName = contentType?.split(';')[0]?.trim().toLowerCase()
  const dispositionName = contentDisposition?.split(';')[0]?.trim().toLowerCase()

  let part = partIndex === 0 ? 'message body' : `MIME part ${partIndex}`
  if (contentTypeName) {
    part = contentTypeName
    if (dispositionName === 'attachment' || contentTypeName === 'application/pdf') {
      part = `${contentTypeName} attachment`
    } else if (contentTypeName.startsWith('text/')) {
      part = `${contentTypeName} body`
    }
  }

  return {
    part,
    contentType: contentTypeName,
    transferEncoding: transferEncoding?.split(';')[0]?.trim().toLowerCase(),
    contentDisposition: dispositionName,
  }
}

function recordLine(
  current: MimeLineRecord,
  line: string,
  lineNumber: number,
  state: { longestLine: MimeLineRecord; linesOver998: number; linesOver2048: number },
) {
  const bytes = Buffer.byteLength(line, 'utf8')
  if (bytes > 998) state.linesOver998 += 1
  if (bytes > 2048) state.linesOver2048 += 1
  if (bytes > state.longestLine.bytes) {
    state.longestLine = {
      ...current,
      bytes,
      lineNumber,
    }
  }
}

export function analyzeMimeLineLengths(message: Buffer | string): MimeLineDiagnostics {
  const source = Buffer.isBuffer(message) ? message.toString('utf8') : message
  const lines = source.split('\n')
  const state = {
    longestLine: {
      bytes: 0,
      lineNumber: 0,
      part: 'empty message',
      section: 'body' as const,
    },
    linesOver998: 0,
    linesOver2048: 0,
  }
  let partIndex = 0
  let headers: HeaderMap = {}
  let lastHeader: string | null = null
  let current: MimeLineRecord = {
    bytes: 0,
    lineNumber: 0,
    part: 'message headers',
    section: 'headers',
  }

  lines.forEach((rawLine, index) => {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine
    const lineNumber = index + 1

    if (line.startsWith('--')) {
      recordLine(
        { bytes: 0, lineNumber, part: 'MIME boundary', section: 'boundary' },
        line,
        lineNumber,
        state,
      )

      if (!line.endsWith('--')) {
        partIndex += 1
        headers = {}
        lastHeader = null
        current = {
          bytes: 0,
          lineNumber,
          part: `MIME part ${partIndex} headers`,
          section: 'headers',
        }
      }
      return
    }

    recordLine(current, line, lineNumber, state)

    if (current.section !== 'headers') return

    if (line === '') {
      current = {
        bytes: 0,
        lineNumber,
        section: 'body',
        ...describeMimePart(partIndex, headers),
      }
      lastHeader = null
      return
    }

    if (/^\s/.test(line) && lastHeader) {
      headers[lastHeader] = `${headers[lastHeader]} ${line.trim()}`
      return
    }

    const headerMatch = line.match(/^([^:]+):\s*(.*)$/)
    if (headerMatch) {
      lastHeader = headerMatch[1].toLowerCase()
      headers[lastHeader] = headerMatch[2].trim()
    }
  })

  return {
    maxLineBytes: state.longestLine.bytes,
    linesOver998: state.linesOver998,
    linesOver2048: state.linesOver2048,
    longestLine: state.longestLine,
  }
}

async function inspectGeneratedMime(payload: CompleteTransactionalEmailPayload): Promise<MimeLineDiagnostics> {
  const transport = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: 'windows',
  })
  const info = await transport.sendMail(buildMailOptions(payload))
  const message = (info as { message?: Buffer | string }).message ?? ''
  return analyzeMimeLineLengths(message)
}

export async function inspectTransactionalEmailMime(
  payload: TransactionalEmailPayload,
): Promise<MimeLineDiagnostics> {
  return inspectGeneratedMime({ ...payload, from: payload.from?.trim() || defaultFrom() })
}

function mimeLineDiagnosticsForLog(diagnostics: MimeLineDiagnostics) {
  return {
    maxLineBytes: diagnostics.maxLineBytes,
    linesOver998: diagnostics.linesOver998,
    linesOver2048: diagnostics.linesOver2048,
    longestLine: {
      bytes: diagnostics.longestLine.bytes,
      lineNumber: diagnostics.longestLine.lineNumber,
      part: diagnostics.longestLine.part,
      section: diagnostics.longestLine.section,
      contentType: diagnostics.longestLine.contentType,
      transferEncoding: diagnostics.longestLine.transferEncoding,
      contentDisposition: diagnostics.longestLine.contentDisposition,
    },
  }
}

function parseSmtpStatus(responseText?: string) {
  const match = responseText?.match(/\b([245]\d{2})\b/)
  return match ? Number(match[1]) : undefined
}

function sanitizeSmtpResponse(responseText?: string) {
  return responseText?.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
}

function errorForLog(error: unknown) {
  if (error instanceof Error) {
    const details = error as Error & {
      code?: unknown
      command?: unknown
      responseCode?: unknown
      response?: unknown
    }
    return {
      name: error.name,
      message: error.message,
      code: details.code,
      command: details.command,
      responseCode: details.responseCode,
      response: typeof details.response === 'string' ? sanitizeSmtpResponse(details.response) : undefined,
    }
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return { message: String((error as { message?: unknown }).message) }
  }
  return { message: String(error ?? 'Unknown error') }
}

async function checkMimeLineLengths(payload: CompleteTransactionalEmailPayload): Promise<MailSendResult | null> {
  try {
    const diagnostics = await inspectGeneratedMime(payload)
    const logDetails = mimeLineDiagnosticsForLog(diagnostics)

    if (diagnostics.linesOver2048 > 0) {
      console.error('[Email MIME] Generated email has SMTP-invalid line lengths', {
        ...smtpLogContext(payload),
        ...logDetails,
      })
      return {
        ok: false,
        provider: 'smtp',
        error: 'Generated email MIME contains a line longer than 2048 bytes.',
      }
    }

    if (diagnostics.linesOver998 > 0) {
      console.warn('[Email MIME] Generated email has lines over the SMTP 998-byte recommendation', {
        ...smtpLogContext(payload),
        ...logDetails,
      })
      return null
    }

    console.info('[Email MIME] Line-length check passed', {
      ...smtpLogContext(payload),
      ...logDetails,
    })
    return null
  } catch (error) {
    console.error('[Email MIME] Line-length inspection failed', {
      ...smtpLogContext(payload),
      error: errorForLog(error),
    })
    return null
  }
}

async function sendSmtpEmail(payload: CompleteTransactionalEmailPayload): Promise<MailSendResult> {
  const host = smtpHost()
  const user = smtpUser()
  const password = smtpPassword()
  if (!host || !user || !password) {
    return { ok: false, provider: 'smtp', error: 'SMTP_HOST, SMTP_USER, and SMTP_PASSWORD or SMTP_PASS are required.' }
  }

  const port = Number(envValue('SMTP_PORT') || 465)
  if (!Number.isFinite(port) || port <= 0) {
    return { ok: false, provider: 'smtp', error: 'SMTP_PORT must be a valid port number.' }
  }

  const secure = (envValue('SMTP_SECURE') || (port === 465 ? 'true' : 'false')).toLowerCase() === 'true'
  const authMethod = smtpAuthMethod()
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    name: smtpEhloDomain(),
    authMethod,
    auth: {
      user,
      pass: password,
    },
    tls: {
      servername: host,
    },
  })

  try {
    const info = await transporter.sendMail(buildMailOptions(payload))
    const responseText = sanitizeSmtpResponse(typeof info.response === 'string' ? info.response : undefined)
    return {
      ok: true,
      provider: 'smtp',
      status: parseSmtpStatus(responseText),
      responseText,
    }
  } catch (error) {
    const isAuthError = isSmtpAuthError(error)
    const authGuidance = isAuthError
      ? 'SMTP authentication failed. Verify the mailbox password in deployment, use the full mailbox address for SMTP_USER, and remove copied spaces or quotes from SMTP_PASSWORD/SMTP_PASS.'
      : undefined
    console.error(isAuthError ? '[Email SMTP] Authentication failed' : '[Email SMTP] Send failed', {
      ...smtpLogContext(payload),
      guidance: authGuidance,
      error: errorForLog(error),
    })
    return {
      ok: false,
      provider: 'smtp',
      error: isAuthError
        ? new Error(`${error instanceof Error ? error.message : 'SMTP authentication failed.'} ${authGuidance}`)
        : error,
    }
  }
}

function isSmtpAuthError(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const details = error as { code?: unknown; responseCode?: unknown; command?: unknown; message?: unknown }
  return details.code === 'EAUTH' || details.responseCode === 535 || String(details.command ?? '').startsWith('AUTH')
}

export async function sendTransactionalEmail(payload: TransactionalEmailPayload): Promise<MailSendResult> {
  const recipients = normalizeRecipients(payload.to)
  const requestedFrom = cleanEnv(payload.from) || defaultFrom()
  const fullPayload = { ...payload, to: recipients.valid, from: alignSenderWithAuthenticatedMailbox(requestedFrom) }
  const missing = missingSmtpSettings()

  if (recipients.invalid.length) {
    console.error('[Email SMTP] Invalid email recipient(s) skipped', {
      ...smtpLogContext(fullPayload),
      invalidRecipientCount: recipients.invalid.length,
    })
  }

  if (!fullPayload.to.length) {
    console.error('[Email SMTP] No valid recipients configured', smtpLogContext(fullPayload))
    return { ok: false, provider: 'log', error: 'No valid email recipients configured.' }
  }

  if (missing.length) {
    console.error('[Email SMTP] Missing SMTP configuration', {
      ...smtpLogContext(fullPayload),
      missing,
    })
    return { ok: false, provider: 'log', error: `Missing SMTP configuration: ${missing.join(', ')}` }
  }

  const mimeFailure = await checkMimeLineLengths(fullPayload)
  if (mimeFailure) return mimeFailure

  console.info('[Email SMTP] Sending transactional email', smtpLogContext(fullPayload))
  return sendSmtpEmail(fullPayload)
}
