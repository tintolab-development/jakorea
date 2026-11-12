import { describe, expect, it } from 'vitest'
import {
  buildRejectedFileTypeMessageLines,
  fileNameExtension,
  isFileAcceptedBy,
  partitionFilesByAccept,
} from './file-accept-filter'

const file = (name: string, type = '') => ({ name, type })

describe('fileNameExtension', () => {
  it('마지막 점 뒤 확장자(소문자)', () => {
    expect(fileNameExtension('보고서.FINAL.PDF')).toBe('.pdf')
    expect(fileNameExtension('README')).toBe('')
    expect(fileNameExtension('.env')).toBe('')
  })
})

describe('isFileAcceptedBy', () => {
  it('확장자 토큰 (대소문자 무시)', () => {
    expect(isFileAcceptedBy(file('a.JPG'), '.jpg,.png')).toBe(true)
    expect(isFileAcceptedBy(file('a.exe'), '.jpg,.png')).toBe(false)
  })

  it('MIME 그룹·정확한 MIME 토큰', () => {
    expect(isFileAcceptedBy(file('a.heic', 'image/heic'), 'image/*')).toBe(true)
    expect(isFileAcceptedBy(file('a.txt', 'text/plain'), 'image/*')).toBe(false)
    expect(isFileAcceptedBy(file('a.pdf', 'application/pdf'), 'application/pdf')).toBe(true)
  })

  it('accept가 없으면 모두 허용', () => {
    expect(isFileAcceptedBy(file('a.exe'), undefined)).toBe(true)
    expect(isFileAcceptedBy(file('a.exe'), '')).toBe(true)
  })
})

describe('partitionFilesByAccept / buildRejectedFileTypeMessageLines', () => {
  it('허용 파일만 남기고 제외 파일과 허용 형식을 안내한다', () => {
    const { accepted, rejected } = partitionFilesByAccept(
      [file('ok.png'), file('bad.exe'), file('ok.pdf'), file('bad.zip')],
      '.png,.pdf'
    )
    expect(accepted.map(f => f.name)).toEqual(['ok.png', 'ok.pdf'])
    expect(rejected.map(f => f.name)).toEqual(['bad.exe', 'bad.zip'])
    expect(buildRejectedFileTypeMessageLines(rejected, '.png,.pdf')).toEqual([
      '등록할 수 없는 형식의 파일은 제외했습니다.',
      'bad.exe, bad.zip',
      '등록 가능한 형식: PNG, PDF',
    ])
  })
})
