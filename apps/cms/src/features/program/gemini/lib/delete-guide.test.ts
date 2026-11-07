import { describe, expect, it } from 'vitest'
import {
  geminiRecruitmentDeleteBlocked,
  resolveGeminiDeleteBlockedAlert,
  resolveGeminiDeleteGuideModalCopy,
} from './delete-guide'

describe('gemini delete-guide', () => {
  it('단건 공고 삭제는 해당 공고 문구', () => {
    expect(resolveGeminiDeleteGuideModalCopy('공고', 1)).toEqual({
      title: '공고 삭제 안내',
      lines: ['해당 공고를 삭제하시겠습니까?', '삭제된 정보는 되돌릴 수 없습니다.'],
    })
  })

  it('복수 실적 삭제는 선택 건수를 강조한다', () => {
    expect(resolveGeminiDeleteGuideModalCopy('실적', 2)).toEqual({
      title: '실적 삭제 안내',
      lines: [
        '선택한 **2**개의 실적을 삭제하시겠습니까?',
        '삭제된 정보는 되돌릴 수 없습니다.',
      ],
    })
  })

  it('승인 연수 삭제는 이력에 따른 삭제 불가 조건을 함께 안내한다', () => {
    expect(resolveGeminiDeleteGuideModalCopy('연수', 1, ['제이초등학교'])).toEqual({
      title: '연수 삭제 안내',
      lines: [
        '**[제이초등학교]** 연수를 삭제하시겠습니까?',
        '삭제된 정보는 되돌릴 수 없습니다.',
        '신청 강사 또는 교육 진행 이력이 있는 연수는 삭제할 수 없습니다.',
      ],
    })
  })

  it('공고명을 삭제 안내에 표시하고 긴 이름은 줄여서 표시한다', () => {
    expect(
      resolveGeminiDeleteGuideModalCopy('공고', 1, [
        '공고명욕칠팔구십일이삼사오육칠팔구십일이삼사오육',
      ])
    ).toEqual({
      title: '공고 삭제 안내',
      lines: [
        '**[공고명욕칠팔구십일이삼사오육칠팔구십...]** 공고를 삭제하시겠습니까?',
        '삭제된 정보는 되돌릴 수 없습니다.',
      ],
    })
  })

  it('복수 공고 삭제는 대표 공고명과 나머지 건수를 표시한다', () => {
    expect(resolveGeminiDeleteGuideModalCopy('공고', 2, ['첫 번째 공고', '두 번째 공고'])).toEqual({
      title: '공고 삭제 안내',
      lines: [
        '**[첫 번째 공고] 외 1개** 공고를 삭제하시겠습니까?',
        '삭제된 정보는 되돌릴 수 없습니다.',
      ],
    })
  })

  it('단건 삭제 불가는 사유만 안내한다', () => {
    expect(resolveGeminiDeleteBlockedAlert('연수', 1)).toEqual({
      title: '연수 삭제 불가 안내',
      content: '신청 강사 또는 교육 진행 이력이 있는 연수는 삭제할 수 없습니다.',
    })
  })

  it('신청 기관이 있으면 공고 삭제를 막는다', () => {
    expect(geminiRecruitmentDeleteBlocked({ organizationApplicationCount: 1 })).toBe(true)
    expect(
      geminiRecruitmentDeleteBlocked({
        organizationApplicationCount: 0,
        approvedOrganizationApplicationCount: 0,
      })
    ).toBe(false)
  })

  it('임시저장 공고는 신청 카운트가 있어도 삭제할 수 있다', () => {
    expect(
      geminiRecruitmentDeleteBlocked({
        isDraft: true,
        organizationApplicationCount: 2,
        approvedOrganizationApplicationCount: 1,
      })
    ).toBe(false)
  })

  it('복수 선택에 불가 건이 있으면 첫 문장을 붙인다', () => {
    expect(resolveGeminiDeleteBlockedAlert('공고', 3).content).toBe(
      '**선택한 3개의 항목** 중 삭제가 불가한 항목이 포함되어 있습니다.\n신청 기관 또는 교육 진행 이력이 있는 공고는 삭제할 수 없습니다.'
    )
  })
})
