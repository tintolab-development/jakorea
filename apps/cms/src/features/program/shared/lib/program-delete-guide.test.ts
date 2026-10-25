import { describe, expect, it } from 'vitest'
import {
  buildProgramBulkDeleteGuideLines,
  buildProgramHardDeleteBlockedAlertContent,
  buildProgramSingleDeleteGuideLines,
  ProgramHardDeleteBlockedError,
  isProgramHardDeleteBlockedError,
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

  it('삭제 불가 — 단건은 사유만', () => {
    expect(
      buildProgramHardDeleteBlockedAlertContent(
        1,
        '교육 예정 신청자 또는 교육 진행 이력이 있는 프로그램은 삭제할 수 없습니다.'
      )
    ).toBe('교육 예정 신청자 또는 교육 진행 이력이 있는 프로그램은 삭제할 수 없습니다.')
  })

  it('삭제 불가 — message가 없으면 기획 문장으로 폴백', () => {
    const error = new ProgramHardDeleteBlockedError(2, '  ')
    expect(isProgramHardDeleteBlockedError(error)).toBe(true)
    expect(error.message).toContain('**선택한 2개의 항목** 중 삭제가 불가한 항목이 포함되어 있습니다.')
    expect(error.message).toContain(
      '교육 예정 신청자 또는 교육 진행 이력이 있는 프로그램은 삭제할 수 없습니다.'
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
