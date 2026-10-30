/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { programToDetailEditValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { GeneralProgramParticipantRecruitmentInfoView } from './participant-recruitment-info-view'

const program = {
  id: 'program-1',
  title: '모집 상한 수정',
  category: 'school',
  type: 'offline',
  format: 'workshop',
  status: 'active',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  sponsorId: 'sponsor-1',
  managerName: '담당자',
  description: '설명',
  generalProgramAudience: 'organization',
  generalParticipantTypes: ['school_institution'],
  generalCommonInfo: {
    participantRecruitmentInfo: {
      maxAssignableInstructors: 3,
      maxClassCount: 2,
      maxScheduleCount: 2,
      maxSessionsPerDay: 5,
    },
  },
} as Program

function Harness({
  formRef,
}: {
  formRef: { current: ReturnType<typeof useForm<ProgramDetailEditFormValues>> | null }
}) {
  const form = useForm<ProgramDetailEditFormValues>({
    defaultValues: programToDetailEditValues(program),
  })
  formRef.current = form
  return (
    <GeneralProgramParticipantRecruitmentInfoView program={program} form={form} isEdit />
  )
}

describe('GeneralProgramParticipantRecruitmentInfoView', () => {
  it('신청 가능 최대 학급 수를 비워도 이전 숫자로 되돌리지 않는다', () => {
    const formRef: {
      current: ReturnType<typeof useForm<ProgramDetailEditFormValues>> | null
    } = { current: null }

    render(<Harness formRef={formRef} />)

    const field = screen
      .getByText('신청 가능 최대 학급 수', { selector: '.detail-info-form__field-label-text' })
      .closest('.detail-info-form__field')
    if (!field) throw new Error('신청 가능 최대 학급 수 필드를 찾지 못했습니다')
    const input = field.querySelector('input')
    if (!input) throw new Error('학급 수 인풋을 찾지 못했습니다')

    expect(formRef.current?.getValues().participantRecruitmentMaxClassCount).toBe(2)
    fireEvent.change(input, { target: { value: '' } })
    expect(formRef.current?.getValues().participantRecruitmentMaxClassCount).toBeNull()
    expect(input.value).toBe('')
  })

  describe('개인 프로그램 「참여자 면접 유무」', () => {
    const individualProgram = (interviewEnabled?: boolean) =>
      ({
        ...program,
        category: 'individual',
        generalProgramAudience: 'individual',
        generalParticipantTypes: ['individual'],
        ...(interviewEnabled === undefined
          ? {}
          : { generalParticipantInterviewEnabled: interviewEnabled }),
      }) as Program

    const viewOf = (p: Program) => {
      const { container, unmount } = render(
        <GeneralProgramParticipantRecruitmentInfoView program={p} isEdit={false} />
      )
      const label = screen.getByText('참여자 면접 유무', {
        selector: '.detail-info-form__field-label-text',
      })
      const text = label.closest('.detail-info-form__field')?.textContent ?? ''
      unmount()
      void container
      return text
    }

    it.each([
      [true, '면접 있음'],
      [false, '면접 없음'],
      [undefined, '-'],
    ] as const)('%s → %s', (value, expected) => {
      expect(viewOf(individualProgram(value))).toBe(`참여자 면접 유무${expected}`)
    })

    it('기관 프로그램에는 행이 없다', () => {
      render(<GeneralProgramParticipantRecruitmentInfoView program={program} isEdit={false} />)
      expect(screen.queryByText('참여자 면접 유무')).toBeNull()
    })

    it('면접 있음이면 2차 면접 기간이 보인다', () => {
      const { unmount } = render(
        <GeneralProgramParticipantRecruitmentInfoView
          program={individualProgram(true)}
          isEdit={false}
        />
      )
      expect(screen.getByText('2차 면접 기간')).toBeTruthy()
      expect(screen.getByText('1차 서류 합격자 발표')).toBeTruthy()
      unmount()
    })

    it('면접 없음이면 2차 면접 기간이 없다', () => {
      const { unmount } = render(
        <GeneralProgramParticipantRecruitmentInfoView
          program={individualProgram(false)}
          isEdit={false}
        />
      )
      expect(screen.queryByText('2차 면접 기간')).toBeNull()
      expect(screen.queryByText('1차 서류 합격자 발표')).toBeNull()
      unmount()
    })
  })
})
