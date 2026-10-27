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

  it('maps the confirmed-assignment-required merge error', () => {
    expect(
      resolveOrganizationMergeErrorMessage({
        error: { code: 'GENERAL_ORGANIZATION_MERGE_CONFIRMED_ASSIGNMENT_REQUIRED' },
      })
    ).toBe('같은 기관의 확정 배정 학급이 2건 이상이어야 합반할 수 있습니다.')
  })

  it('no longer maps the removed same-education-date codes', () => {
    expect(
      resolveOrganizationMergeErrorMessage(
        { error: { code: 'GENERAL_ORGANIZATION_MERGE_SAME_EDUCATION_DATE_REQUIRED' } },
        { fallback: '저장에 실패했습니다.' }
      )
    ).not.toContain('교육일')
  })

  it('maps CLASS_MERGE_CANCEL_NOT_ALLOWED (DELETE 409) to the cancel-not-allowed message', () => {
    expect(
      resolveOrganizationMergeErrorMessage(
        { error: { code: 'CLASS_MERGE_CANCEL_NOT_ALLOWED', message: '서버 문구' } },
        { httpStatus: 409 }
      )
    ).toBe('합반 확정 후에는 취소할 수 없습니다.')
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

  it('maps PATCH lead-teacher errors (NOT_ACTIVE, LEAD_TEACHER_MUST_BE_MEMBER_TEACHER)', () => {
    expect(
      resolveOrganizationMergeErrorMessage({
        error: { code: 'GENERAL_ORGANIZATION_MERGE_NOT_ACTIVE' },
      })
    ).toContain('유효하지 않은 합반')
    expect(
      resolveOrganizationMergeErrorMessage({
        error: { code: 'GENERAL_ORGANIZATION_MERGE_LEAD_TEACHER_MUST_BE_MEMBER_TEACHER' },
      })
    ).toContain('대표 담당 교사')
  })
})
