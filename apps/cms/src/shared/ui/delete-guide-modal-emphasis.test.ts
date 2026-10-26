import { describe, expect, it } from 'vitest'
import { splitDeleteGuideEmphasis } from './delete-guide-modal'

describe('splitDeleteGuideEmphasis', () => {
  it('마스킹 별표가 있는 이름도 ** 마커를 제거하고 굵게 나눈다', () => {
    expect(splitDeleteGuideEmphasis('**[한*] 님 외 1명**을 삭제하시겠습니까?')).toEqual([
      { text: '[한*] 님 외 1명', bold: true },
      { text: '을 삭제하시겠습니까?', bold: false },
    ])
    expect(splitDeleteGuideEmphasis('**[한****자] 님 외 1명**을 삭제하시겠습니까?')).toEqual([
      { text: '[한****자] 님 외 1명', bold: true },
      { text: '을 삭제하시겠습니까?', bold: false },
    ])
  })

  it('숫자만 감싼 강조는 앞뒤 문장을 유지한다', () => {
    expect(splitDeleteGuideEmphasis('선택한 **3**개의 프로그램을 삭제하시겠습니까?')).toEqual([
      { text: '선택한 ', bold: false },
      { text: '3', bold: true },
      { text: '개의 프로그램을 삭제하시겠습니까?', bold: false },
    ])
  })

  it('별표가 없는 강조와 대괄호 강조를 유지한다', () => {
    expect(splitDeleteGuideEmphasis('**[홍길동] 님**을 삭제하시겠습니까?')).toEqual([
      { text: '[홍길동] 님', bold: true },
      { text: '을 삭제하시겠습니까?', bold: false },
    ])
    expect(splitDeleteGuideEmphasis('[학교명]를 삭제하시겠습니까?')).toEqual([
      { text: '[학교명]', bold: true },
      { text: '를 삭제하시겠습니까?', bold: false },
    ])
  })
})
