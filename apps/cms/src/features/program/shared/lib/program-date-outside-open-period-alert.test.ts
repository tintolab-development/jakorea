import { describe, expect, it } from 'vitest'
import {
  registrationStepForOperationDateFocus,
  resolveProgramDateOutsideOpenPeriodAlert,
} from '@/features/program/shared/lib/program-date-outside-open-period-alert'

function axiosError(body: unknown) {
  return { response: { data: body } }
}

const instructorStart = axiosError({
  success: false,
  error: {
    code: 'PROGRAM_DATE_OUTSIDE_OPEN_PERIOD',
    message: '입력값을 확인해 주세요.',
    field: 'recruitments.INSTRUCTOR.operationStartDate',
    details: {
      date: '2026-10-01',
      openStart: '2026-10-03',
      openEnd: '2026-11-30',
      field: 'recruitments.INSTRUCTOR.operationStartDate',
    },
  },
})

describe('resolveProgramDateOutsideOpenPeriodAlert', () => {
  it('강사 운영 시작일이 전체 기간보다 빠르면 안내문을 만든다', () => {
    const alert = resolveProgramDateOutsideOpenPeriodAlert(instructorStart)
    expect(alert?.title).toBe('운영 기간을 확인해 주세요')
    expect(alert?.content).toBe(
      [
        '강사의 운영 시작일이 프로그램 전체 운영 기간을 벗어났습니다.',
        '프로그램 전체 운영 기간: 2026.10.03 ~ 2026.11.30',
        '입력한 날짜: 2026.10.01',
        '운영 기간을 2026.10.03 ~ 2026.11.30 범위 내에서 설정해 주세요.',
      ].join('\n')
    )
    expect(alert?.focus.highlightKeys).toEqual(['recruit.instructor.programRangeSeal'])
  })

  it('강사 운영 종료일과 참여자·봉사자 필드를 구분한다', () => {
    const instructorEnd = resolveProgramDateOutsideOpenPeriodAlert(
      axiosError({
        error: {
          code: 'PROGRAM_DATE_OUTSIDE_OPEN_PERIOD',
          field: 'recruitments.INSTRUCTOR.operationEndDate',
          details: {
            date: '2026-12-01T00:00:00.000Z',
            openStart: '2026-10-03',
            openEnd: '2026-11-30',
          },
        },
      })
    )
    expect(instructorEnd?.content).toContain('강사의 운영 종료일')
    expect(instructorEnd?.content).toContain('입력한 날짜: 2026.12.01')

    const participant = resolveProgramDateOutsideOpenPeriodAlert(
      axiosError({
        error: {
          code: 'PROGRAM_DATE_OUTSIDE_OPEN_PERIOD',
          field: 'recruitments.PARTICIPANT.operationStartDate',
          details: { date: '2026-09-01', openStart: '2026-10-03', openEnd: '2026-11-30' },
        },
      })
    )
    expect(participant?.content).toContain('참여자의 운영 시작일')
    expect(participant?.focus.highlightKeys).toEqual([
      'recruit.institution.programRangeSeal',
      'recruit.individual.programRangeSeal',
    ])

    const volunteer = resolveProgramDateOutsideOpenPeriodAlert(
      axiosError({
        error: {
          code: 'PROGRAM_DATE_OUTSIDE_OPEN_PERIOD',
          field: 'recruitments.VOLUNTEER.operationEndDate',
          details: { date: '2026-12-02', openStart: '2026-10-03', openEnd: '2026-11-30' },
        },
      })
    )
    expect(volunteer?.content).toContain('봉사자의 운영 종료일')
    expect(volunteer?.focus.highlightKeys).toEqual(['recruit.volunteer.programRangeSeal'])
  })

  it('details가 빠지면 기간 숫자 없이 기본 안내를 쓴다', () => {
    const alert = resolveProgramDateOutsideOpenPeriodAlert(
      axiosError({
        error: {
          code: 'PROGRAM_DATE_OUTSIDE_OPEN_PERIOD',
          message: '입력값을 확인해 주세요.',
        },
      })
    )
    expect(alert?.content).toBe(
      [
        '운영 기간이 프로그램 전체 운영 기간을 벗어났습니다.',
        '운영 기간을 프로그램 전체 운영 기간 안에서 다시 설정해 주세요.',
      ].join('\n')
    )
    expect(alert?.content).not.toContain('입력값을 확인해 주세요.')
  })

  it('다른 오류 코드는 다루지 않는다', () => {
    expect(
      resolveProgramDateOutsideOpenPeriodAlert(
        axiosError({ error: { code: 'VERSION_CONFLICT', message: '충돌' } })
      )
    ).toBeNull()
  })
})

describe('registrationStepForOperationDateFocus', () => {
  it('보이는 모집 단계로만 이동한다', () => {
    expect(
      registrationStepForOperationDateFocus('INSTRUCTOR', [
        'recruit-participant-school',
        'recruit-instructor',
      ])
    ).toBe('recruit-instructor')
    expect(
      registrationStepForOperationDateFocus('PARTICIPANT', ['recruit-participant-individual'])
    ).toBe('recruit-participant-individual')
    expect(registrationStepForOperationDateFocus('VOLUNTEER', ['recruit-instructor'])).toBeNull()
  })
})
