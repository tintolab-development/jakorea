import { describe, expect, it } from 'vitest'
import {
  buildInstitutionClassCountOptions,
  resolveProgramParticipantMaxClassCount,
} from './participant-recruitment-institution-limits'

describe('resolveProgramParticipantMaxClassCount', () => {
  it('participantRecruitmentInfo.maxClassCount를 우선 사용한다', () => {
    expect(
      resolveProgramParticipantMaxClassCount({
        generalCommonInfo: { participantRecruitmentInfo: { maxClassCount: 9 } },
        rounds: [{ classCount: 4 }],
      })
    ).toBe(9)
  })

  it('maxClassCount가 없으면 1회차 classCount를 사용한다', () => {
    expect(
      resolveProgramParticipantMaxClassCount({
        rounds: [{ classCount: 6 }],
      })
    ).toBe(6)
  })
})

describe('buildInstitutionClassCountOptions', () => {
  it('최대 학급 수 N이면 1~N 옵션을 만든다', () => {
    expect(buildInstitutionClassCountOptions(9)).toEqual(
      Array.from({ length: 9 }, (_, i) => ({
        value: String(i + 1),
        label: String(i + 1),
      }))
    )
  })

  it('최대 학급 수가 없으면 옵션을 비운다', () => {
    expect(buildInstitutionClassCountOptions(undefined)).toEqual([])
    expect(buildInstitutionClassCountOptions(null)).toEqual([])
  })
})
