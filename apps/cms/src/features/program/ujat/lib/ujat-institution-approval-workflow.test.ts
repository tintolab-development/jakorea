import { describe, expect, it } from 'vitest'
import {
  readUjatInstitutionWorkflowInput,
  resolveUjatInstitutionWorkflow,
  UJAT_REVISION_REQUEST_PENDING_REASON,
} from './ujat-institution-approval-workflow'

describe('resolveUjatInstitutionWorkflow', () => {
  it('SUBMITTED이고 임시 배정이 없으면 최종 승인을 열지 않는다', () => {
    const view = resolveUjatInstitutionWorkflow({
      applicationStatus: 'SUBMITTED',
      temporaryAssignmentStatus: null,
      institutionConfirmationStatus: null,
      assignmentLockedAt: null,
      portalBannerState: null,
    })

    expect(view.displayLabel).toBe('일정 배정 필요')
    expect(view.primaryLabel).toBe('임시 일정 배정')
    expect(view.primaryAction).toBe('open_schedule_assign')
    expect(view.canFinalApprove).toBe(false)
  })

  it('임시 배정 후 기관 확인 대기에서는 승인 API를 호출하지 않는다', () => {
    const view = resolveUjatInstitutionWorkflow({
      applicationStatus: 'SUBMITTED',
      temporaryAssignmentStatus: 'TEMP_ASSIGNED',
      institutionConfirmationStatus: 'CHECKING',
    })

    expect(view.displayLabel).toBe('기관 확인 대기')
    expect(view.primaryLabel).toBe('기관 확인 대기')
    expect(view.primaryDisabled).toBe(true)
    expect(view.canFinalApprove).toBe(false)
  })

  it('기관 확인이 끝나면 일정 잠금이 있어도 최종 승인만 허용한다', () => {
    const view = resolveUjatInstitutionWorkflow({
      applicationStatus: 'SUBMITTED',
      temporaryAssignmentStatus: 'TEMP_ASSIGNED',
      institutionConfirmationStatus: 'CONFIRMED',
      assignmentLockedAt: '2026-10-23T05:00:00Z',
    })

    expect(view.displayLabel).toBe('기관 확인 완료')
    expect(view.primaryLabel).toBe('최종 승인')
    expect(view.canFinalApprove).toBe(true)
    expect(view.scheduleEditDisabled).toBe(true)
    expect(view.revisionRequestDisabled).toBe(false)
  })

  it('일정 수정 요청 상태에서는 재배정만 열고 승인은 막는다', () => {
    const view = resolveUjatInstitutionWorkflow({
      applicationStatus: 'SUBMITTED',
      temporaryAssignmentStatus: 'TEMP_ASSIGNED',
      institutionConfirmationStatus: 'REVISION_REQUESTED',
      assignmentLockedAt: null,
    })

    expect(view.displayLabel).toBe('일정 수정 필요')
    expect(view.primaryLabel).toBe('일정 재배정')
    expect(view.primaryAction).toBe('open_schedule_assign')
    expect(view.canFinalApprove).toBe(false)
    expect(view.revisionRequestDisabled).toBe(true)
    expect(view.revisionRequestDisabledReason).toBe(UJAT_REVISION_REQUEST_PENDING_REASON)
  })

  describe('revisionRequestDisabled', () => {
    const tempAssignedBase = {
      applicationStatus: 'SUBMITTED',
      temporaryAssignmentStatus: 'TEMP_ASSIGNED',
      assignmentLockedAt: '2026-10-23T05:00:00Z',
    }

    it('CONFIRMED(잠금 포함)에서는 수정 요청을 허용한다', () => {
      const view = resolveUjatInstitutionWorkflow({
        ...tempAssignedBase,
        institutionConfirmationStatus: 'CONFIRMED',
      })
      expect(view.revisionRequestDisabled).toBe(false)
      expect(view.revisionRequestDisabledReason).toBeUndefined()
    })

    it('REVISION_REQUESTED에서는 수정 요청을 막고 안내를 준다', () => {
      const view = resolveUjatInstitutionWorkflow({
        ...tempAssignedBase,
        institutionConfirmationStatus: 'REVISION_REQUESTED',
      })
      expect(view.revisionRequestDisabled).toBe(true)
      expect(view.revisionRequestDisabledReason).toBe(UJAT_REVISION_REQUEST_PENDING_REASON)
    })

    it('CHECKING에서는 수정 요청을 막는다', () => {
      const view = resolveUjatInstitutionWorkflow({
        applicationStatus: 'SUBMITTED',
        temporaryAssignmentStatus: 'TEMP_ASSIGNED',
        institutionConfirmationStatus: 'CHECKING',
      })
      expect(view.revisionRequestDisabled).toBe(true)
      expect(view.revisionRequestDisabledReason).toBeDefined()
    })

    it('APPROVED·REJECTED에서는 수정 요청을 막는다', () => {
      expect(
        resolveUjatInstitutionWorkflow({
          applicationStatus: 'APPROVED',
          temporaryAssignmentStatus: 'TEMP_ASSIGNED',
          institutionConfirmationStatus: 'CONFIRMED',
        }).revisionRequestDisabled
      ).toBe(true)
      expect(
        resolveUjatInstitutionWorkflow({
          applicationStatus: 'REJECTED',
          temporaryAssignmentStatus: 'TEMP_ASSIGNED',
          institutionConfirmationStatus: 'CONFIRMED',
        }).revisionRequestDisabled
      ).toBe(true)
    })
  })

  it('applicationStatus가 APPROVED여도 임시 배정·기관 확인 없이 다시 승인하지 않는다', () => {
    const view = resolveUjatInstitutionWorkflow({
      applicationStatus: 'APPROVED',
      temporaryAssignmentStatus: null,
      institutionConfirmationStatus: null,
    })

    expect(view.canFinalApprove).toBe(false)
    expect(view.primaryDisabled).toBe(true)
    expect(view.scheduleEditDisabled).toBe(true)
  })

  it('임시 배정 반려는 최종 승인을 열지 않는다', () => {
    const view = resolveUjatInstitutionWorkflow({
      applicationStatus: 'SUBMITTED',
      temporaryAssignmentStatus: 'TEMP_REJECTED',
    })

    expect(view.displayLabel).toBe('임시 배정 반려')
    expect(view.canFinalApprove).toBe(false)
  })
})

describe('readUjatInstitutionWorkflowInput', () => {
  it('상세에 없는 기관 확인 상태는 임시 일정 응답을 쓴다', () => {
    const input = readUjatInstitutionWorkflowInput(
      { applicationStatus: 'SUBMITTED', temporaryAssignmentStatus: 'TEMP_ASSIGNED' },
      {
        institutionConfirmationStatus: 'CONFIRMED',
        assignmentLockedAt: '2026-10-23T05:00:00Z',
        portalBannerState: 'ADMIN_REVIEW',
      }
    )

    expect(input.institutionConfirmationStatus).toBe('CONFIRMED')
    expect(input.assignmentLockedAt).toBe('2026-10-23T05:00:00Z')
    expect(input.portalBannerState).toBe('ADMIN_REVIEW')
  })

  it('상세의 명시적 null은 임시 일정 값으로 덮지 않는다', () => {
    const input = readUjatInstitutionWorkflowInput(
      {
        applicationStatus: 'SUBMITTED',
        temporaryAssignmentStatus: null,
        institutionConfirmationStatus: null,
      },
      {
        temporaryAssignmentStatus: 'TEMP_ASSIGNED',
        institutionConfirmationStatus: 'CONFIRMED',
      }
    )

    expect(input.temporaryAssignmentStatus).toBeNull()
    expect(input.institutionConfirmationStatus).toBeNull()
  })
})
