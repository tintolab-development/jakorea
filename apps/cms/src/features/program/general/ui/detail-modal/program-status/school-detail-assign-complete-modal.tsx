/**
 * 강사 배정 완료 안내 모달
 * 배정 처리 직후 노출. 승인&배정이 함께 이뤄진 경우에만 "승인 알림 발송" 영역 노출.
 */

import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import '@/shared/components/permission-modal.css'

const ASSIGN_COMPLETE_MODAL_WIDTH = 600
/** 풀페이지 상세 위 중첩 모달(antd 스택 ~2000)보다 위 */
const ASSIGN_COMPLETE_MODAL_Z_INDEX = 2500

export interface SchoolDetailAssignCompleteModalProps {
  open: boolean
  onClose: () => void
  /** 배정된 강사명 */
  instructorName: string
  /** 배정 대상 기관명 */
  schoolName: string
  /** 현재 배정 인원 (배정 반영 후 기준) */
  currentCount: number
  /** 필요 배정 인원 수 */
  requiredCount: number
  /** true면 승인 알림 발송 영역 노출 (승인+배정 동시 처리 시) */
  showApprovalAlarmSection?: boolean
  /** `general-institution` — 일반 기관형 시안 10·11-4(배정 완료). 기본은 기존 문구 */
  copyVariant?: 'default' | 'general-institution'
  /** `general-institution` 일괄 배정 시 강사명 목록(「[X] 님 외 N명」) */
  instructorNames?: string[]
}

/** 시안 10·11-4 본문 */
export function buildGeneralInstitutionAssignCompleteDescription(
  instructorNames: string[],
  currentCount: number,
  requiredCount: number
): string {
  const unique = Array.from(new Set(instructorNames.map(name => name.trim()).filter(Boolean)))
  const first = unique[0] ?? '강사'
  const subject =
    unique.length > 1 ? `[**${first}**] 님 외 ${unique.length - 1}명` : `[**${first}**] 님`
  return `${subject}이 배정되었습니다.\n(현재 배정 인원 : ${currentCount}/${requiredCount}명)`
}

function buildAssignCompleteDescription(
  instructorName: string,
  schoolName: string,
  currentCount: number,
  requiredCount: number
): string {
  return `[**${instructorName}**] 강사님의 [**${schoolName}**] 배정이 완료되었습니다.\n(현재 배정 인원 : ${currentCount}/${requiredCount}명)`
}

export function SchoolDetailAssignCompleteModal({
  open,
  onClose,
  instructorName,
  schoolName,
  currentCount,
  requiredCount,
  showApprovalAlarmSection = false,
  copyVariant = 'default',
  instructorNames,
}: SchoolDetailAssignCompleteModalProps) {
  const isGeneralInstitution = copyVariant === 'general-institution'
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title={isGeneralInstitution ? '배정 완료' : '강사 배정 완료 안내'}
      width={ASSIGN_COMPLETE_MODAL_WIDTH}
      zIndex={ASSIGN_COMPLETE_MODAL_Z_INDEX}
      description={
        isGeneralInstitution
          ? buildGeneralInstitutionAssignCompleteDescription(
              instructorNames ?? [instructorName],
              currentCount,
              requiredCount
            )
          : buildAssignCompleteDescription(instructorName, schoolName, currentCount, requiredCount)
      }
      footer={
        <CmsButton
          variant={isGeneralInstitution ? 'secondary' : 'primary'}
          size="large"
          onClick={onClose}
        >
          확인
        </CmsButton>
      }
    >
      {showApprovalAlarmSection && !isGeneralInstitution ? (
        <p className="permission-modal__hint">
          승인 알림은 배정 처리와 함께 서버에서 발송됩니다. 이 화면에서는 발송 시점을 변경할 수
          없습니다.
        </p>
      ) : null}
    </ContentModal>
  )
}
