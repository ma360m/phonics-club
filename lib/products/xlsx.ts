import * as XLSX from 'xlsx'
import { PRODUCT_EXPORT_COLUMNS, parseImportRowsFromObjects, productsToCsv, rowToExportRecord } from './import-export'

export function parseXlsx(buffer: ArrayBuffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return []
  const sheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
}

export function productsToXlsxBuffer(products: Record<string, unknown>[]): ArrayBuffer {
  const data = products.map(rowToExportRecord)
  const worksheet = XLSX.utils.json_to_sheet(data, { header: [...PRODUCT_EXPORT_COLUMNS] })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')
  const buf = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  return buf
}

export function parseXlsxImport(buffer: ArrayBuffer) {
  const objects = parseXlsx(buffer)
  return parseImportRowsFromObjects(objects)
}

export { productsToCsv }
