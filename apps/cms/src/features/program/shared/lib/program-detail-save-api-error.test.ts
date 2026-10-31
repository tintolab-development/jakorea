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

  it('maps SCHEDULE_LINE_UNPARSEABLE to the schedule date field', () => {
    expect(
      resolveProgramDetailSaveApiFormField({
        apiField: 'scheduleDateLabel',
        message:
          '교육 일정 날짜/시간 형식을 해석할 수 없습니다. scheduleDetails[1] scheduleDateLabel=2026.13.40(목)',
        errorCode: 'SCHEDULE_LINE_UNPARSEABLE',
      })
    ).toBe('scheduleDetails.1.scheduleDate')
    expect(
      resolveProgramDetailSaveApiFormField({
        apiField: 'schedules',
        message: '일정형 일반 프로그램에는 유효한 교육 일정이 필요합니다.',
        errorCode: 'GENERAL_PROGRAM_ACTIVE_SCHEDULE_REQUIRED',
      })
    ).toBe('educationScheduleLines')
  })
})
