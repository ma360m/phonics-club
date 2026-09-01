import { COMPANY_BANK_DETAILS } from '@/lib/company'

export interface BankDetails {
  bankName: string
  accountTitle: string
  accountNumber: string
  iban: string
  instructions: string
}

export const DEFAULT_BANK_DETAILS: BankDetails = {
  bankName: COMPANY_BANK_DETAILS.bankName,
  accountTitle: COMPANY_BANK_DETAILS.accountTitle,
  accountNumber: COMPANY_BANK_DETAILS.accountNumber,
  iban: COMPANY_BANK_DETAILS.iban,
  instructions: COMPANY_BANK_DETAILS.instructions,
}

export const DEFAULT_COURSE_BANK_DETAILS: BankDetails = {
  bankName: 'Allied Bank',
  accountTitle: 'Phonics Club Consultancy',
  accountNumber: '0010033565850013',
  iban: 'PK76ABPA0010033565850013',
  instructions: 'Transfer the course fee to this account and upload a clear payment screenshot from your course payment page.',
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function firstText(...values: unknown[]): string {
  return values.map(asTrimmedString).find(Boolean) ?? ''
}

export function normalizeBankDetails(value: unknown, fallback: BankDetails = DEFAULT_BANK_DETAILS): BankDetails {
  const data = value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}

  return {
    bankName: firstText(data.bankName, fallback.bankName),
    accountTitle: firstText(data.accountTitle, fallback.accountTitle),
    accountNumber: firstText(data.accountNumber, fallback.accountNumber),
    iban: asTrimmedString(data.iban) || fallback.iban || '',
    instructions: firstText(data.instructions, fallback.instructions),
  }
}

export function looksLikeCourseBankDetails(details: BankDetails): boolean {
  const accountNumber = details.accountNumber.replace(/\D/g, '')
  const courseAccountNumber = DEFAULT_COURSE_BANK_DETAILS.accountNumber.replace(/\D/g, '')

  return (
    accountNumber === courseAccountNumber ||
    details.iban === DEFAULT_COURSE_BANK_DETAILS.iban ||
    details.accountTitle.toLowerCase().includes('consultancy')
  )
}

export function normalizeShopBankDetails(value: unknown): BankDetails {
  const normalized = normalizeBankDetails(value, DEFAULT_BANK_DETAILS)
  return looksLikeCourseBankDetails(normalized) ? DEFAULT_BANK_DETAILS : normalized
}
