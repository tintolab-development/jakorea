import { describe, expect, it } from 'vitest'
import {
  buildProgramBulkDeleteGuideLines,
  buildProgramSingleDeleteGuideLines,
  resolveProgramDeleteGuideModalCopy,
} from './program-delete-guide'

describe('program-delete-guide', () => {
  it('단건 본문 — 볼드 마커 없음', () => {
    expect(buildProgramSingleDeleteGuideLines()).toEqual([
      '해당 프로그램을 삭제하시겠습니까?',
      '삭제된 정보는 되돌릴 수 없습니다.',
    ])
  })

  it('일괄 본문 — 선택 건수만 ** 강조', () => {
    expect(buildProgramBulkDeleteGuideLines(3)[0]).toBe(
      '선택한 **3**개의 프로그램을 삭제하시겠습니까?'
    )
  })

  it('resolveProgramDeleteGuideModalCopy — 2건 이상은 일괄 타이틀', () => {
    expect(resolveProgramDeleteGuideModalCopy(2)).toEqual({
      title: '프로그램 일괄 삭제 안내',
      lines: [
        '선택한 **2**개의 프로그램을 삭제하시겠습니까?',
        '삭제된 정보는 되돌릴 수 없습니다.',
      ],
    })
  })
})
