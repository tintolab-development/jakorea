import { describe, expect, it } from 'vitest'
import { APPROVAL_STATUS_LABELS } from '@/shared/components/textbook-status-badge'
import {
  mapVolunteerDocumentStatusToApprovalStatus,
  shouldShowVolunteerInterviewAvailabilitySection,
  shouldShowVolunteerManagerEvaluationSection,
  mapVolunteerProgramApprovalStatus,
  volunteerApplicationApprovalStatusLabel,
  volunteerApplicationDecisionButtonLabels,
  volunteerProgramApprovalStatusLabel,
} from './volunteer-application-detail-visibility'
import { buildGeneralVolunteerDoc1FilterFields } from './volunteer-doc-screening-filter-fields'

describe('volunteer application detail visibility (interview off)', () => {
  it('면접 없음 상세 CTA는 참여 승인/반려, 면접 있음은 서류 승인/반려', () => {
    expect(volunteerApplicationDecisionButtonLabels(false)).toEqual({
      reject: '참여 반려',
      approve: '참여 승인',
    })
    expect(volunteerApplicationDecisionButtonLabels(true)).toEqual({
      reject: '서류 반려',
      approve: '서류 승인',
    })
  })

  it('면접 없음이면 담당자 서류 평가·면접 가능 일정을 숨긴다', () => {
    expect(shouldShowVolunteerManagerEvaluationSection(false)).toBe(false)
    expect(shouldShowVolunteerInterviewAvailabilitySection(false)).toBe(false)
    expect(shouldShowVolunteerManagerEvaluationSection(true)).toBe(true)
    expect(shouldShowVolunteerInterviewAvailabilitySection(true)).toBe(true)
  })

  it('서류 심사 상태를 프로그램 승인 현황으로 매핑한다', () => {
    expect(mapVolunteerDocumentStatusToApprovalStatus('pending')).toBe('pending')
    expect(mapVolunteerDocumentStatusToApprovalStatus('pass')).toBe('approved')
    expect(mapVolunteerDocumentStatusToApprovalStatus('fail')).toBe('rejected')
    expect(volunteerApplicationApprovalStatusLabel('pending')).toBe(APPROVAL_STATUS_LABELS.pending)
    expect(volunteerApplicationApprovalStatusLabel('pass')).toBe(APPROVAL_STATUS_LABELS.approved)
    expect(volunteerApplicationApprovalStatusLabel('fail')).toBe(APPROVAL_STATUS_LABELS.rejected)
  })

  it('면접 없음 승인은 applicationStatus APPROVED를 일정 미배정과 섞지 않는다', () => {
    expect(
      mapVolunteerProgramApprovalStatus({
        applicationStatus: 'APPROVED',
        documentScreeningStatus: 'pending',
      })
    ).toBe('approved')
    expect(
      volunteerProgramApprovalStatusLabel({
        applicationStatus: 'APPROVED',
        documentScreeningStatus: 'pending',
      })
    ).toBe(APPROVAL_STATUS_LABELS.approved)
  })

  it('면접 없음 목록 필터에서 담당자 평가를 빼고 프로그램 승인 현황을 쓴다', () => {
    const interviewOff = buildGeneralVolunteerDoc1FilterFields({ interviewEnabled: false })
    expect(interviewOff.map(field => field.key)).toEqual([
      'volunteerName',
      'documentScreeningStatus',
    ])
    expect(interviewOff.find(field => field.key === 'documentScreeningStatus')?.label).toBe(
      '프로그램 승인 현황'
    )

    const interviewOn = buildGeneralVolunteerDoc1FilterFields({ interviewEnabled: true })
    expect(interviewOn.map(field => field.key)).toEqual([
      'volunteerName',
      'jaVolunteerExperience',
      'managerAEvaluation',
      'managerBEvaluation',
      'documentScreeningStatus',
    ])
    expect(interviewOn.find(field => field.key === 'documentScreeningStatus')?.label).toBe(
      '1차 서류 심사 현황'
    )
  })
})
