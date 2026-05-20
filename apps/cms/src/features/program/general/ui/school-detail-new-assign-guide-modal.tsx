/**
 * 강사 신규 배정 안내 모달
 * 최초 승인이 이루어지지 않은 강사를 배정할 때 노출.
 * "프로그램 참여 승인과 함께 [학교명]에 새로 배정하시겠습니까?" 확인 후 강사 배정(승인+배정) 진행.
 */

import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import './school-detail-new-assign-guide-modal.css'

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
  /** "강사 배정" 클릭 시 호출 (승인 + 배정 처리) */
  onConfirm: () => void
}

export function SchoolDetailNewAssignGuideModal({
  open,
  onCancel,
  instructorName,
  schoolName,
  currentCount,
  requiredCount,
  onConfirm,
}: SchoolDetailNewAssignGuideModalProps) {
  const footer = (
    <>
      <CmsButton variant="secondary" size="large" onClick={onCancel}>
        취소
      </CmsButton>
      <CmsButton variant="primary" size="large" onClick={onConfirm}>
        강사 배정
      </CmsButton>
    </>
  )

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="강사 신규 배정 안내"
      width={560}
      footer={footer}
      className="school-detail-new-assign-guide-modal"
    >
      <div className="school-detail-new-assign-guide-modal__body">
        <p className="school-detail-new-assign-guide-modal__line">
          [<strong>{instructorName}</strong>] 강사님은 아직 프로그램 참여 승인이 이루어지지
          않았습니다.
        </p>
        <p className="school-detail-new-assign-guide-modal__line">
          프로그램 참여 승인과 함께 [<strong>{schoolName}</strong>]에 새로 배정하시겠습니까?
        </p>
        <p className="school-detail-new-assign-guide-modal__sub">
          (현재 배정 인원 : {currentCount}/{requiredCount}명)
        </p>
      </div>
    </ContentModal>
  )
}
