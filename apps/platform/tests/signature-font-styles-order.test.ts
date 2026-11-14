import { describe, expect, it } from 'vitest'
import { SIGNATURE_FONT_STYLES } from '../src/shared/ui/pf-electronic-signature-modal/signature-fonts'

describe('서명 만들기 스타일 (Figma 14482-22611)', () => {
  it('시안 순서로 보여 준다', () => {
    expect(SIGNATURE_FONT_STYLES.map(style => style.family)).toEqual([
      '"JA Signature NanumDahaeng"',
      '"JA Signature GangwonEduAll"',
      '"JA Signature KimjungchulScript"',
      '"JA Signature OngleipParkDahyun"',
      '"JA Signature OngleipKimKonghae"',
      '"JA Signature NanumPen"',
    ])
  })

  it('저장된 스타일 코드와 폰트의 대응은 바꾸지 않는다', () => {
    const familyByCode = Object.fromEntries(SIGNATURE_FONT_STYLES.map(style => [style.code, style.family]))
    expect(familyByCode).toEqual({
      'style-01': '"JA Signature NanumPen"',
      'style-02': '"JA Signature NanumDahaeng"',
      'style-03': '"JA Signature OngleipKimKonghae"',
      'style-04': '"JA Signature OngleipParkDahyun"',
      'style-05': '"JA Signature GangwonEduAll"',
      'style-06': '"JA Signature KimjungchulScript"',
    })
  })
})
