/**
 * 강사 배정 완료 안내 모달
 * 배정 처리 직후 노출. 승인&배정이 함께 이뤄진 경우에만 "승인 알림 발송" 영역 노출.
 */

import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import { ApprovalAlarmSendSection } from '../../approval-alarm-send-section'

const ASSIGN_COMPLETE_MODAL_WIDTH = 600
/** 풀페이지 상세 위 중첩 모달(antd 스택 ~2000)보다 위 */
const ASSIGN_COMPLETE_MODAL_Z_INDEX = 2500
const DATE_TIME_PICKER_Z_OFFSET = 100

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
}: SchoolDetailAssignCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="강사 배정 완료 안내"
      width={ASSIGN_COMPLETE_MODAL_WIDTH}
      zIndex={ASSIGN_COMPLETE_MODAL_Z_INDEX}
      description={buildAssignCompleteDescription(
        instructorName,
        schoolName,
        currentCount,
        requiredCount
      )}
      footer={
        <CmsButton variant="primary" size="large" onClick={onClose}>
          확인
        </CmsButton>
      }
    >
      {showApprovalAlarmSection ? (
        <ApprovalAlarmSendSection
          resetWhen={open}
          dateTimePickerZIndex={ASSIGN_COMPLETE_MODAL_Z_INDEX + DATE_TIME_PICKER_Z_OFFSET}
        />
      ) : null}
    </ContentModal>
  )
}
