import { describe, expect, it } from 'vitest'
import { resolveProgramDetailSaveApiFormField } from './program-detail-save-api-error'

describe('resolveProgramDetailSaveApiFormField', () => {
  it('maps lodging BAD_REQUEST to wage payment items, not student roster', () => {
    expect(
      resolveProgramDetailSaveApiFormField({
        apiField: 'studentListRequired',
        message: '학생·참여자 프로그램에는 숙박비 지급 항목을 설정할 수 없습니다.',
        errorCode: 'BAD_REQUEST',
      })
    ).toBe('wagePaymentItemIds')
  })

  it('does not attach PROGRAM_STUDENT_DOCUMENTS_NOT_SUPPORTED to a form field', () => {
    expect(
      resolveProgramDetailSaveApiFormField({
        apiField: 'studentListRequired',
        message: '학생 명단을 지원하지 않는 프로그램입니다.',
        errorCode: 'PROGRAM_STUDENT_DOCUMENTS_NOT_SUPPORTED',
      })
    ).toBeUndefined()
  })
})
