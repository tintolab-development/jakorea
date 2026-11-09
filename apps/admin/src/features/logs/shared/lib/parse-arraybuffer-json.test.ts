import { describe, expect, it } from 'vitest'
import {
  parseJsonPayloadFromArrayBuffer,
  resolveLogExcelBytes,
} from './parse-arraybuffer-json'

function toBuffer(text: string): ArrayBuffer {
  return new TextEncoder().encode(text).buffer
}

describe('parseJsonPayloadFromArrayBuffer', () => {
  it('parses JSON error envelopes from export responses', () => {
    const payload = parseJsonPayloadFromArrayBuffer(
      toBuffer(
        '{"success":false,"error":{"code":"NOT_ACCEPTABLE","message":"No acceptable representation"}}',
      ),
    )
    expect(payload).toEqual({
      success: false,
      error: { code: 'NOT_ACCEPTABLE', message: 'No acceptable representation' },
    })
  })

  it('does not treat xlsx zip bytes as JSON', () => {
    expect(parseJsonPayloadFromArrayBuffer(toBuffer('PK\u0003\u0004binary'))).toBeNull()
  })
})

describe('resolveLogExcelBytes', () => {
  it('keeps raw xlsx zip bytes', () => {
    const raw = toBuffer('PK\u0003\u0004xlsx')
    expect(new Uint8Array(resolveLogExcelBytes(raw))[0]).toBe(0x50)
  })

  it('decodes OpenAPI format:byte JSON string', () => {
    const zip = 'PK\u0003\u0004xlsx'
    const b64 = btoa(zip)
    const decoded = resolveLogExcelBytes(toBuffer(JSON.stringify(b64)))
    expect(new TextDecoder().decode(decoded)).toBe(zip)
  })

  it('decodes wrapped { data: base64 } success payload', () => {
    const zip = 'PK\u0003\u0004xlsx'
    const decoded = resolveLogExcelBytes(
      toBuffer(JSON.stringify({ success: true, data: btoa(zip) })),
    )
    expect(new TextDecoder().decode(decoded)).toBe(zip)
  })

  it('throws on JSON error envelope', () => {
    expect(() =>
      resolveLogExcelBytes(
        toBuffer('{"success":false,"error":{"message":"No acceptable representation"}}'),
      ),
    ).toThrow('No acceptable representation')
  })

  it('throws on top-level DATA_INTEGRITY_CONFLICT', () => {
    expect(() =>
      resolveLogExcelBytes(
        toBuffer(
          '{"code":"DATA_INTEGRITY_CONFLICT","message":"The requested change conflicts with existing data.","timestamp":"2026-11-08T22:18:27.301022Z"}',
        ),
      ),
    ).toThrow('The requested change conflicts with existing data.')
  })
})
