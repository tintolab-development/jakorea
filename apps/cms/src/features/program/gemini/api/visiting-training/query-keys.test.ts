import { describe, expect, it } from 'vitest'
import { geminiVisitingTrainingQueryKeys } from './query-keys'

function isQueryKeyPrefix(prefix: readonly unknown[], key: readonly unknown[]) {
  return prefix.length <= key.length && prefix.every((part, index) => part === key[index])
}

describe('gemini visiting-training query keys', () => {
  it('강사 신청 무효화 키는 필터가 붙은 목록 키의 prefix다', () => {
    const trainingId = '185334'
    const filtersKey = JSON.stringify({ approvalStatus: 'ALL' })
    const listKey = geminiVisitingTrainingQueryKeys.approvedInstructorApplications(
      trainingId,
      filtersKey
    )
    const invalidateKey =
      geminiVisitingTrainingQueryKeys.approvedInstructorApplications(trainingId)

    expect(isQueryKeyPrefix(invalidateKey, listKey)).toBe(true)
    expect(invalidateKey).not.toContain('')
  })

  it('승인 연수 목록 무효화 키는 필터가 붙은 목록 키의 prefix다', () => {
    const filtersKey = JSON.stringify({})
    const listKey = geminiVisitingTrainingQueryKeys.approvedList(filtersKey)
    const invalidateKey = geminiVisitingTrainingQueryKeys.approvedList()

    expect(isQueryKeyPrefix(invalidateKey, listKey)).toBe(true)
  })
})
