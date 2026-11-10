/**
 * 강사 신규 배정 안내 모달
 * 최초 승인이 이루어지지 않은 강사를 배정할 때 노출.
 * "프로그램 참여 승인과 함께 [학교명]에 새로 배정하시겠습니까?" 확인 후 강사 배정(승인+배정) 진행.
 */

import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'

const NEW_ASSIGN_GUIDE_MODAL_WIDTH = 600

export type SchoolDetailNewAssignGuideVariant = 'confirm-assign' | 'guide-only' | 'approve-and-assign'

export interface SchoolDetailNewAssignGuideModalProps {
  open: boolean
  onCancel: () => void
  /** 강사명 */
  instructorName: string
  /** 배정 대상 기관명 */
  schoolName: string
  /** 현재 배정된 인원 수 */
  currentCount: number
  /** 필요 배정 인원 수 (정원) */
  requiredCount: number
  /**
   * - confirm-assign: 추가 배정 — 취소/강사 배정 (승인+배정 즉시)
   * - guide-only: 선택 배정 1차 — 안내 확인 후 강사비 승인 단계로 진행
   * - approve-and-assign: 일반 기관형 선택 배정(시안 09-2·11-2) — 취소/승인 및 배정 후 강사비 책정 단계
   */
  variant?: SchoolDetailNewAssignGuideVariant
  /** 확인(또는 강사 배정) 클릭 시 */
  onConfirm: () => void
  /** `approve-and-assign` — 선택한 강사 수(중복 제외) */
  selectedInstructorCount?: number
  /** `approve-and-assign` — 그중 승인 전 강사 수 */
  unapprovedInstructorCount?: number
}

/** 시안 09-2(단건)·11-2(일괄) 본문 */
export function buildApproveAndAssignGuideDescription(input: {
  instructorName: string
  schoolName: string
  selectedInstructorCount: number
  unapprovedInstructorCount: number
  currentCount: number
  requiredCount: number
}): string {
  const countLine = `(현재 배정 인원 : ${input.currentCount}/${input.requiredCount}명)`
  if (input.selectedInstructorCount > 1) {
    return `**선택한 ${input.selectedInstructorCount}명 중 ${input.unapprovedInstructorCount}명**은 아직 프로그램 신청이 승인되지 않았습니다.\n신청을 모두 승인하고 **[${input.schoolName}]**에 배정하시겠습니까?\n${countLine}`
  }
  return `**[${input.instructorName}]** 님은 아직 프로그램 신청이 승인되지 않았습니다.\n신청을 승인하고 **[${input.schoolName}]**에 배정하시겠습니까?\n${countLine}`
}

function buildNewAssignGuideDescription(
  instructorName: string,
  schoolName: string,
  currentCount: number,
  requiredCount: number
): string {
  return `[**${instructorName}**] 강사님은 아직 프로그램 참여 승인이 이루어지지 않았습니다.\n프로그램 참여 승인과 함께 [**${schoolName}**]에 새로 배정하시겠습니까?\n(현재 배정 인원 : ${currentCount}/${requiredCount}명)`
}

export function SchoolDetailNewAssignGuideModal({
  open,
  onCancel,
  instructorName,
  schoolName,
  currentCount,
  requiredCount,
  variant = 'confirm-assign',
  onConfirm,
  selectedInstructorCount = 1,
  unapprovedInstructorCount = 1,
}: SchoolDetailNewAssignGuideModalProps) {
  if (variant === 'approve-and-assign') {
    return (
      <ContentModal
        open={open}
        onCancel={onCancel}
        title={selectedInstructorCount > 1 ? '강사 일괄 선택 배정 안내' : '강사 선택 배정 안내'}
        width={NEW_ASSIGN_GUIDE_MODAL_WIDTH}
        description={buildApproveAndAssignGuideDescription({
          instructorName,
          schoolName,
          selectedInstructorCount,
          unapprovedInstructorCount,
          currentCount,
          requiredCount,
        })}
        footer={
          <>
            <CmsButton variant="secondary" size="large" onClick={onCancel}>
              취소
            </CmsButton>
            <CmsButton variant="primary" size="large" onClick={onConfirm}>
              승인 및 배정
            </CmsButton>
          </>
        }
      >
        {null}
      </ContentModal>
    )
  }

  const isGuideOnly = variant === 'guide-only'

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="강사 신규 배정 안내"
      width={NEW_ASSIGN_GUIDE_MODAL_WIDTH}
      description={buildNewAssignGuideDescription(
        instructorName,
        schoolName,
        currentCount,
        requiredCount
      )}
      footer={
        isGuideOnly ? (
          <CmsButton variant="primary" size="large" onClick={onConfirm}>
            확인
          </CmsButton>
        ) : (
          <>
            <CmsButton variant="secondary" size="large" onClick={onCancel}>
              취소
            </CmsButton>
            <CmsButton variant="primary" size="large" onClick={onConfirm}>
              강사 배정
            </CmsButton>
          </>
        )
      }
    >
      {null}
    </ContentModal>
  )
}
