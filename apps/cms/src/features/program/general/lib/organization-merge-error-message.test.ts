import { describe, expect, it, vi } from 'vitest'
import { resolveOrganizationMergeErrorMessage } from './organization-merge-error-message'

describe('resolveOrganizationMergeErrorMessage', () => {
  it('maps merge error.code to a user message and logs traceId', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(
      resolveOrganizationMergeErrorMessage({
        success: false,
        message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        error: {
          code: 'GENERAL_ORGANIZATION_MERGE_NEXT_SCHEDULE_REQUIRED',
          message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
          traceId: 'abc',
        },
      })
    ).toBe('합반을 적용할 다음 교육 일정이 없습니다. 교육 일정을 확인해 주세요.')
    expect(errorSpy).toHaveBeenCalledWith(
      '[organization-merge]',
      'GENERAL_ORGANIZATION_MERGE_NEXT_SCHEDULE_REQUIRED',
      'abc'
    )
    errorSpy.mockRestore()
  })

  it('maps same-education-date merge errors', () => {
    expect(
      resolveOrganizationMergeErrorMessage({
        error: { code: 'GENERAL_ORGANIZATION_MERGE_SAME_EDUCATION_DATE_REQUIRED' },
      })
    ).toBe('같은 교육일의 학급만 합반할 수 있습니다.')
    expect(
      resolveOrganizationMergeErrorMessage({
        error: { code: 'GENERAL_ORGANIZATION_MERGE_EDUCATION_DATE_MISSING' },
      })
    ).toBe('합반 대상 학급의 교육 일정을 확인할 수 없습니다.')
  })

  it('keeps the common message for an unknown code', () => {
    expect(
      resolveOrganizationMergeErrorMessage(
        {
          message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
          error: { code: 'INTERNAL_SERVER_ERROR', traceId: 'trace-1' },
        },
        { httpStatus: 500, fallback: '저장에 실패했습니다.' }
      )
    ).toBe('서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
  })
})
