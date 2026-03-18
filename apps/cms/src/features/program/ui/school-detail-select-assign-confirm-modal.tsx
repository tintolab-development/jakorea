/**
 * 선택 배정 확인 모달 (강사 배정 안내 컨펌)
 * 배정 대기 강사 목록에서 강사 선택 후 "선택 배정" 클릭 시 노출.
 * 스크린샷 스펙: "[강사명] 강사님을 [학교명]에 새로 배정하시겠습니까?" (현재 배정 인원 : n/m명), 취소/강사 배정
 */

import { ContentModal } from '@/shared/ui/content-modal'
import { AppButton } from '@/shared/ui/app-button'
import './school-detail-select-assign-confirm-modal.css'

export interface SchoolDetailSelectAssignConfirmModalProps {
  open: boolean
  onCancel: () => void
  /** 배정 대상 기관명 */
  schoolName: string
  /** 선택한 강사명 목록 (배정 대기 목록에서 선택된 행) */
  instructorNames: string[]
  /** 현재 배정된 인원 수 */
  currentCount: number
  /** 필요 배정 인원 수 (분모) */
  requiredCount: number
  /** "강사 배정" 클릭 시 호출 */
  onConfirm: () => void
}

export function SchoolDetailSelectAssignConfirmModal({
  open,
  onCancel,
  schoolName,
  instructorNames,
  currentCount,
  requiredCount,
  onConfirm,
}: SchoolDetailSelectAssignConfirmModalProps) {
  const footer = (
    <>
      <AppButton variant="cancel" size="large" onClick={onCancel}>
        취소
      </AppButton>
      <AppButton variant="primary" size="large" modalTeal onClick={onConfirm}>
        강사 배정
      </AppButton>
    </>
  )

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="강사 배정 안내"
      width={560}
      footer={footer}
      className="school-detail-select-assign-confirm-modal"
    >
      <div className="school-detail-select-assign-confirm-modal__body">
        <p className="school-detail-select-assign-confirm-modal__main">
          {instructorNames.length > 0 ? (
            <>
              {instructorNames.map((name, i) => (
                <span key={`${name}-${i}`}>
                  [<strong>{name}</strong>]{i < instructorNames.length - 1 ? ', ' : ''}
                </span>
              ))}{' '}
              강사님을 [<strong>{schoolName}</strong>]에 새로 배정하시겠습니까?
            </>
          ) : (
            <>
              [<strong>{schoolName}</strong>]에 새로 배정하시겠습니까?
            </>
          )}
        </p>
        <p className="school-detail-select-assign-confirm-modal__sub">
          (현재 배정 인원 : {currentCount}/{requiredCount}명)
        </p>
      </div>
    </ContentModal>
  )
}
