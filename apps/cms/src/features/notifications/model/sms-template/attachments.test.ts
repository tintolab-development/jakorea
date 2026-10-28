import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  rejectSmsMmsAttachments,
  rejectSmsMmsAttachmentsSync,
  SMS_MMS_ATTACHMENT_MAX_FILE_BYTES,
  SMS_MMS_ATTACHMENT_MAX_TOTAL_BYTES,
} from './attachments'

function jpegFile(name: string, size: number, type = 'image/jpeg'): File {
  return new File([new Uint8Array(size)], name, { type })
}

function sync(incoming: File[], currentCount = 0, currentTotalBytes = 0) {
  return rejectSmsMmsAttachmentsSync({ incoming, currentCount, currentTotalBytes })
}

describe('rejectSmsMmsAttachmentsSync (MMS 첨부 계약)', () => {
  it('uses 300KiB per file and 600KiB total', () => {
    expect(SMS_MMS_ATTACHMENT_MAX_FILE_BYTES).toBe(307_200)
    expect(SMS_MMS_ATTACHMENT_MAX_TOTAL_BYTES).toBe(614_400)
  })

  it('rejects 3 or more attachments (max 2)', () => {
    expect(sync([jpegFile('c.jpg', 10)], 2).reason).toBe('count')
    const result = sync([jpegFile('a.jpg', 10), jpegFile('b.jpg', 10), jpegFile('c.jpg', 10)])
    expect(result.reason).toBe('count')
    expect(result.accepted).toHaveLength(2)
  })

  it('rejects non-jpg/jpeg extension', () => {
    expect(sync([new File([new Uint8Array(10)], 'a.png', { type: 'image/png' })]).reason).toBe(
      'extension'
    )
  })

  it('rejects jpg name with non-image/jpeg MIME', () => {
    expect(sync([jpegFile('a.jpg', 10, 'image/png')]).reason).toBe('extension')
  })

  it('accepts .jpeg with empty browser MIME', () => {
    expect(sync([jpegFile('a.jpeg', 10, '')]).reason).toBeNull()
  })

  it('rejects a file over 300KiB', () => {
    expect(sync([jpegFile('a.jpg', SMS_MMS_ATTACHMENT_MAX_FILE_BYTES + 1)]).reason).toBe(
      'file-size'
    )
    expect(sync([jpegFile('a.jpg', SMS_MMS_ATTACHMENT_MAX_FILE_BYTES)]).reason).toBeNull()
  })

  it('rejects total over 600KiB', () => {
    const result = sync(
      [jpegFile('b.jpg', SMS_MMS_ATTACHMENT_MAX_FILE_BYTES)],
      1,
      SMS_MMS_ATTACHMENT_MAX_TOTAL_BYTES - SMS_MMS_ATTACHMENT_MAX_FILE_BYTES + 1
    )
    expect(result.reason).toBe('total-size')
  })

  it('rejects file name over 40 chars', () => {
    expect(sync([jpegFile(`${'a'.repeat(37)}.jpg`, 10)]).reason).toBe('name-length')
    expect(sync([jpegFile(`${'a'.repeat(36)}.jpg`, 10)]).reason).toBeNull()
  })

  it('rejects file name with spaces', () => {
    expect(sync([jpegFile('my notice.jpg', 10)]).reason).toBe('name-space')
  })
})

describe('rejectSmsMmsAttachments (resolution)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function stubSize(width: number, height: number) {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width, height, close() {} }))
    )
  }

  it('rejects width over 1500px', async () => {
    stubSize(1501, 100)
    const result = await rejectSmsMmsAttachments({
      incoming: [jpegFile('wide.jpg', 10)],
      currentCount: 0,
      currentTotalBytes: 0,
    })
    expect(result.reason).toBe('resolution')
    expect(result.accepted).toEqual([])
  })

  it('rejects height over 1440px', async () => {
    stubSize(100, 1441)
    const result = await rejectSmsMmsAttachments({
      incoming: [jpegFile('tall.jpg', 10)],
      currentCount: 0,
      currentTotalBytes: 0,
    })
    expect(result.reason).toBe('resolution')
  })

  it('accepts 1500x1440 jpeg', async () => {
    stubSize(1500, 1440)
    const result = await rejectSmsMmsAttachments({
      incoming: [jpegFile('ok.jpg', 10)],
      currentCount: 0,
      currentTotalBytes: 0,
    })
    expect(result.reason).toBeNull()
    expect(result.accepted).toHaveLength(1)
  })
})
