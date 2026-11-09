export function toArrayBuffer(data: unknown): ArrayBuffer | null {
  if (data instanceof ArrayBuffer) return data
  if (ArrayBuffer.isView(data)) {
    const copy = new Uint8Array(data.byteLength)
    copy.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength))
    return copy.buffer
  }
  return null
}

export function parseJsonPayloadFromArrayBuffer(data: ArrayBuffer): unknown | null {
  if (data.byteLength < 2) return null
  const text = new TextDecoder('utf-8').decode(data).replace(/^\uFEFF/, '').trim()
  if (!text.startsWith('{') && !text.startsWith('[') && !text.startsWith('"')) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

export function isZipOrXlsxBytes(data: ArrayBuffer): boolean {
  if (data.byteLength < 2) return false
  const bytes = new Uint8Array(data)
  return bytes[0] === 0x50 && bytes[1] === 0x4b
}

function decodeBase64ToArrayBuffer(value: string): ArrayBuffer | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const comma = trimmed.indexOf(',')
  const payload =
    trimmed.startsWith('data:') && comma >= 0 ? trimmed.slice(comma + 1) : trimmed
  try {
    const binary = atob(payload.replace(/\s/g, ''))
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  } catch {
    return null
  }
}

export function jsonExportErrorMessage(payload: unknown): string | undefined {
  if (payload == null || typeof payload !== 'object') return undefined
  const record = payload as { message?: unknown; error?: { message?: unknown } }
  if (typeof record.message === 'string' && record.message.trim()) return record.message.trim()
  if (typeof record.error?.message === 'string' && record.error.message.trim()) {
    return record.error.message.trim()
  }
  return undefined
}

function isJsonErrorEnvelope(payload: unknown): boolean {
  if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) return false
  const record = payload as { success?: unknown; error?: unknown; code?: unknown }
  if (record.success === false) return true
  if (typeof record.code === 'string' && record.code.trim()) return true
  return record.error != null && typeof record.error === 'object'
}

/** OpenAPI format:byte 는 JSON 문자열(base64) 또는 raw xlsx 둘 다 올 수 있다 */
export function resolveLogExcelBytes(data: unknown): ArrayBuffer {
  const buffer = toArrayBuffer(data)
  if (!buffer || buffer.byteLength < 1) {
    throw new Error('엑셀 내보내기에 실패했습니다. 다시 시도해 주세요.')
  }
  if (isZipOrXlsxBytes(buffer)) return buffer

  const json = parseJsonPayloadFromArrayBuffer(buffer)
  if (typeof json === 'string') {
    const decoded = decodeBase64ToArrayBuffer(json)
    if (decoded && decoded.byteLength > 0) return decoded
  }
  if (json != null && typeof json === 'object') {
    if (isJsonErrorEnvelope(json)) {
      throw new Error(
        jsonExportErrorMessage(json) ?? '엑셀 내보내기에 실패했습니다. 다시 시도해 주세요.',
      )
    }
    const nested = (json as { data?: unknown }).data
    if (typeof nested === 'string') {
      const decoded = decodeBase64ToArrayBuffer(nested)
      if (decoded && decoded.byteLength > 0) return decoded
    }
    throw new Error(
      jsonExportErrorMessage(json) ?? '엑셀 내보내기에 실패했습니다. 다시 시도해 주세요.',
    )
  }

  return buffer
}
