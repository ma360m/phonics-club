import net from 'node:net'
import tls from 'node:tls'

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

function encodeHeader(value: string) {
  return value.replace(/\r?\n/g, ' ').trim()
}

function parseEmailAddress(value: string) {
  const match = value.match(/<([^>]+)>/)
  return (match?.[1] ?? value).trim()
}

function smtpLogContext(payload: TransactionalEmailPayload) {
  const smtpUser = process.env.SMTP_USER?.trim()
  return {
    smtpHost: process.env.SMTP_HOST?.trim() || '[missing]',
    smtpPort: process.env.SMTP_PORT ?? '465',
    smtpSecure: process.env.SMTP_SECURE ?? 'true',
    smtpEhloDomain: process.env.SMTP_EHLO_DOMAIN || '[default]',
    smtpUserDomain: smtpUser?.includes('@') ? smtpUser.split('@').pop() : smtpUser ? '[configured]' : '[missing]',
    orderEmailFromConfigured: Boolean(process.env.ORDER_EMAIL_FROM?.trim()),
    recipientCount: payload.to.length,
    subject: payload.subject,
  }
}

function missingSmtpSettings() {
  return [
    ['SMTP_HOST', process.env.SMTP_HOST],
    ['SMTP_USER', process.env.SMTP_USER],
    ['SMTP_PASSWORD', process.env.SMTP_PASSWORD],
  ]
    .filter(([, value]) => !String(value ?? '').trim())
    .map(([key]) => key)
}

function chunkBase64(value: string) {
  return value.match(/.{1,76}/g)?.join('\r\n') ?? value
}

function buildMimeMessage(payload: Required<Pick<TransactionalEmailPayload, 'from'>> & TransactionalEmailPayload) {
  const headers = [
    `From: ${encodeHeader(payload.from)}`,
    `To: ${payload.to.map(encodeHeader).join(', ')}`,
    `Subject: ${encodeHeader(payload.subject)}`,
    'MIME-Version: 1.0',
    `Date: ${new Date().toUTCString()}`,
  ]

  if (!payload.attachments?.length) {
    return [
      ...headers,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      payload.html,
    ].join('\r\n')
  }

  const boundary = `phonicsclub-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const parts = [
    ...headers,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    payload.html,
  ]

  for (const attachment of payload.attachments) {
    parts.push(
      `--${boundary}`,
      `Content-Type: ${attachment.contentType ?? 'application/pdf'}; name="${encodeHeader(attachment.filename)}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${encodeHeader(attachment.filename)}"`,
      '',
      chunkBase64(attachment.content),
    )
  }

  parts.push(`--${boundary}--`, '')
  return parts.join('\r\n')
}

function readSmtpResponse(socket: net.Socket | tls.TLSSocket): Promise<{ code: number; text: string }> {
  return new Promise((resolve, reject) => {
    let buffer = ''
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('SMTP response timed out.'))
    }, 30000)

    function cleanup() {
      clearTimeout(timeout)
      socket.off('data', onData)
      socket.off('error', onError)
    }

    function onError(error: Error) {
      cleanup()
      reject(error)
    }

    function onData(chunk: Buffer) {
      buffer += chunk.toString('utf8')
      const lines = buffer.split(/\r?\n/).filter(Boolean)
      const lastLine = lines[lines.length - 1]
      if (!lastLine || !/^\d{3}\s/.test(lastLine)) return

      cleanup()
      resolve({ code: Number(lastLine.slice(0, 3)), text: buffer })
    }

    socket.on('data', onData)
    socket.on('error', onError)
  })
}

async function smtpCommand(socket: net.Socket | tls.TLSSocket, command: string, expected: number | number[]) {
  socket.write(`${command}\r\n`)
  const response = await readSmtpResponse(socket)
  const expectedCodes = Array.isArray(expected) ? expected : [expected]
  if (!expectedCodes.includes(response.code)) {
    throw new Error(`SMTP command failed (${response.code}): ${response.text}`)
  }
  return response
}

async function sendSmtpEmail(payload: Required<Pick<TransactionalEmailPayload, 'from'>> & TransactionalEmailPayload): Promise<MailSendResult> {
  const host = process.env.SMTP_HOST?.trim()
  const user = process.env.SMTP_USER?.trim()
  const password = process.env.SMTP_PASSWORD
  if (!host || !user || !password) return { ok: false, provider: 'smtp', error: 'SMTP_HOST, SMTP_USER, and SMTP_PASSWORD are required.' }

  const port = Number(process.env.SMTP_PORT ?? 465)
  const secure = String(process.env.SMTP_SECURE ?? (port === 465 ? 'true' : 'false')).toLowerCase() === 'true'
  const fromAddress = parseEmailAddress(payload.from)
  let socket: net.Socket | tls.TLSSocket | null = null

  try {
    socket = secure
      ? tls.connect({ host, port, servername: host })
      : net.connect({ host, port })

    await new Promise<void>((resolve, reject) => {
      socket?.once(secure ? 'secureConnect' : 'connect', resolve)
      socket?.once('error', reject)
    })
    if (!socket) throw new Error('SMTP socket could not be opened.')
    await readSmtpResponse(socket)
    await smtpCommand(socket, `EHLO ${process.env.SMTP_EHLO_DOMAIN || 'phonicsclub.com'}`, 250)

    if (!secure && String(process.env.SMTP_STARTTLS ?? 'true').toLowerCase() !== 'false') {
      await smtpCommand(socket, 'STARTTLS', 220)
      socket = tls.connect({ socket, host, servername: host })
      await new Promise<void>((resolve, reject) => {
        socket?.once('secureConnect', resolve)
        socket?.once('error', reject)
      })
      if (!socket) throw new Error('SMTP TLS socket could not be opened.')
      await smtpCommand(socket, `EHLO ${process.env.SMTP_EHLO_DOMAIN || 'phonicsclub.com'}`, 250)
    }

    await smtpCommand(socket, 'AUTH LOGIN', 334)
    await smtpCommand(socket, Buffer.from(user).toString('base64'), 334)
    await smtpCommand(socket, Buffer.from(password).toString('base64'), 235)
    await smtpCommand(socket, `MAIL FROM:<${fromAddress}>`, 250)
    for (const recipient of payload.to) {
      await smtpCommand(socket, `RCPT TO:<${parseEmailAddress(recipient)}>`, [250, 251])
    }
    await smtpCommand(socket, 'DATA', 354)
    socket.write(`${buildMimeMessage(payload).replace(/^\./gm, '..')}\r\n.\r\n`)
    await readSmtpResponse(socket)
    await smtpCommand(socket, 'QUIT', 221).catch(() => undefined)
    socket.end()
    return { ok: true, provider: 'smtp' }
  } catch (error) {
    try {
      socket?.destroy()
    } catch {
      // ignore socket cleanup errors
    }
    return { ok: false, provider: 'smtp', error }
  }
}

export async function sendTransactionalEmail(payload: TransactionalEmailPayload): Promise<MailSendResult> {
  const from = payload.from?.trim() || process.env.ORDER_EMAIL_FROM?.trim() || 'Phonics Club <info@phonicsclub.com>'
  const fullPayload = { ...payload, from }
  const missing = missingSmtpSettings()

  if (missing.length) {
    console.error('[Email SMTP] Missing SMTP configuration', {
      ...smtpLogContext(payload),
      missing,
    })
    return { ok: false, provider: 'log', error: `Missing SMTP configuration: ${missing.join(', ')}` }
  }

  console.info('[Email SMTP] Sending transactional email', smtpLogContext(payload))
  return sendSmtpEmail(fullPayload)
}
