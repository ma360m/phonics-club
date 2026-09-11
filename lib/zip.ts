import { deflateRawSync } from 'node:zlib'

export interface ZipEntry {
  name: string
  data: Uint8Array
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  return value >>> 0
})

function crc32(data: Uint8Array) {
  let value = 0xffffffff
  for (const byte of data) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8)
  return (value ^ 0xffffffff) >>> 0
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear())
  return {
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
  }
}

function u16(value: number) {
  const buffer = Buffer.alloc(2)
  buffer.writeUInt16LE(value & 0xffff)
  return buffer
}

function u32(value: number) {
  const buffer = Buffer.alloc(4)
  buffer.writeUInt32LE(value >>> 0)
  return buffer
}

export function createZip(entries: ZipEntry[]) {
  const localParts: Buffer[] = []
  const centralParts: Buffer[] = []
  let offset = 0
  const timestamp = dosDateTime()

  for (const entry of entries) {
    const name = Buffer.from(entry.name.replace(/\\/g, '/'))
    const data = Buffer.from(entry.data)
    const compressed = deflateRawSync(data)
    const checksum = crc32(data)
    const localHeader = Buffer.concat([
      u32(0x04034b50), u16(20), u16(0), u16(8), u16(timestamp.time), u16(timestamp.date),
      u32(checksum), u32(compressed.length), u32(data.length), u16(name.length), u16(0), name,
    ])
    localParts.push(localHeader, compressed)

    const centralHeader = Buffer.concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(8), u16(timestamp.time), u16(timestamp.date),
      u32(checksum), u32(compressed.length), u32(data.length), u16(name.length), u16(0), u16(0),
      u16(0), u16(0), u32(0), u32(offset), name,
    ])
    centralParts.push(centralHeader)
    offset += localHeader.length + compressed.length
  }

  const centralDirectory = Buffer.concat(centralParts)
  const localDirectory = Buffer.concat(localParts)
  const end = Buffer.concat([
    u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length),
    u32(centralDirectory.length), u32(localDirectory.length), u16(0),
  ])
  return Buffer.concat([localDirectory, centralDirectory, end])
}
