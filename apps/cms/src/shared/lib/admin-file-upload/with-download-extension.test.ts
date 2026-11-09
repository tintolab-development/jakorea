import { describe, expect, it } from 'vitest'
import { withDownloadExtension } from './attachments'

describe('withDownloadExtension', () => {
  it('확장자가 없으면 파일 형식으로 붙인다', () => {
    expect(withDownloadExtension('강의보고서_3_1', 'image/jpeg')).toBe('강의보고서_3_1.jpg')
    expect(withDownloadExtension('강의보고서_3', 'image/png; charset=binary')).toBe('강의보고서_3.png')
    expect(withDownloadExtension('보고서', 'application/pdf')).toBe('보고서.pdf')
  })

  it('이미 확장자가 있거나 모르는 형식이면 그대로 둔다', () => {
    expect(withDownloadExtension('report_20261109.pdf', 'image/png')).toBe('report_20261109.pdf')
    expect(withDownloadExtension('강의보고서_3', 'application/octet-stream')).toBe('강의보고서_3')
    expect(withDownloadExtension('강의보고서_3', '')).toBe('강의보고서_3')
  })
})
