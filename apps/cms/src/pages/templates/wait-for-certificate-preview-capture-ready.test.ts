// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { collectCaptureFontShorthands } from './wait-for-certificate-preview-capture-ready'

describe('collectCaptureFontShorthands', () => {
  it('includes the rendered weight and the 400 weight html2canvas uses to measure the baseline', () => {
    const root = document.createElement('div')
    root.innerHTML =
      '<h1 style="font-family: \'Source Han Serif K\'; font-size: 100px; font-weight: 700">봉사활동인증서</h1>' +
      '<p style="font-family: \'Noto Sans KR\'; font-size: 32px; font-weight: 500">확인합니다</p>' +
      '<div style="font-family: \'Noto Sans KR\'; font-size: 32px"><span></span></div>'
    document.body.appendChild(root)

    const fonts = collectCaptureFontShorthands(root)

    expect(fonts).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/700 100px .*Source Han Serif K/),
        expect.stringMatching(/^normal 400 100px .*Source Han Serif K/),
        expect.stringMatching(/500 32px .*Noto Sans KR/),
        expect.stringMatching(/^normal 400 32px .*Noto Sans KR/),
      ])
    )
    // 글자가 없는 요소는 넣지 않고, 같은 조합은 한 번만 넣는다.
    expect(new Set(fonts).size).toBe(fonts.length)
    root.remove()
  })
})
