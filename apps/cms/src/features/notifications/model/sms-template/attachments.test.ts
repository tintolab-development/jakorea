import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  rejectSmsMmsAttachments,
  rejectSmsMmsAttachmentsSync,
  SMS_MMS_ATTACHMENT_MAX_FILE_BYTES,
  SMS_MMS_ATTACHMENT_MAX_TOTAL_BYTES,
} from './attachments'

function jpegFile(name: string, size: number): File {
  return new File([new Uint8Array(size)], name, { type: 'image/jpeg' })
}

describe('rejectSmsMmsAttachmentsSync', () => {
  it('rejects more than 3 files', () => {
    const result = rejectSmsMmsAttachmentsSync({
      incoming: [jpegFile('d.jpg', 10)],
      currentCount: 3,
      currentTotalBytes: 0,
    })
    expect(result.reason).toBe('count')
  })

  it('rejects non-jpeg extension', () => {
    const result = rejectSmsMmsAttachmentsSync({
      incoming: [new File([new Uint8Array(10)], 'a.png', { type: 'image/png' })],
      currentCount: 0,
      currentTotalBytes: 0,
    })
    expect(result.reason).toBe('extension')
  })

  it('rejects file over 300KB', () => {
    const result = rejectSmsMmsAttachmentsSync({
      incoming: [jpegFile('a.jpg', SMS_MMS_ATTACHMENT_MAX_FILE_BYTES + 1)],
      currentCount: 0,
      currentTotalBytes: 0,
    })
    expect(result.reason).toBe('file-size')
  })

  it('rejects total over 800KB', () => {
    const result = rejectSmsMmsAttachmentsSync({
      incoming: [jpegFile('a.jpg', 200 * 1024)],
      currentCount: 1,
      currentTotalBytes: SMS_MMS_ATTACHMENT_MAX_TOTAL_BYTES - 100 * 1024,
    })
    expect(result.reason).toBe('total-size')
  })
})

describe('rejectSmsMmsAttachments', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects images larger than 1000px', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 1001, height: 800, close() {} }))
    )
    const result = await rejectSmsMmsAttachments({
      incoming: [jpegFile('wide.jpg', 10)],
      currentCount: 0,
      currentTotalBytes: 0,
    })
    expect(result.reason).toBe('resolution')
    expect(result.accepted).toEqual([])
  })

  it('accepts jpeg within size and 1000px', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 1000, height: 1000, close() {} }))
    )
    const result = await rejectSmsMmsAttachments({
      incoming: [jpegFile('ok.jpg', 10)],
      currentCount: 0,
      currentTotalBytes: 0,
    })
    expect(result.reason).toBeNull()
    expect(result.accepted).toHaveLength(1)
  })
})
