/**
 * 배정 취소 확인 모달 (배정 취소 안내)
 * 배정된 강사 목록에서 강사 선택 후 "배정 취소" 클릭 시 노출.
 */

import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import './school-detail-unassign-confirm-modal.css'

export interface SchoolDetailUnassignConfirmModalProps {
  open: boolean
  onCancel: () => void
  /** 배정 취소 대상 기관명 */
  schoolName: string
  /** 선택한 강사명 목록 (배정된 목록에서 선택된 행) */
  instructorNames: string[]
  /** "배정 취소" 클릭 시 호출 */
  onConfirm: () => void
}

export function SchoolDetailUnassignConfirmModal({
  open,
  onCancel,
  schoolName,
  instructorNames,
  onConfirm,
}: SchoolDetailUnassignConfirmModalProps) {
  const footer = (
    <>
      <CmsButton variant="secondary" size="large" onClick={onCancel}>
        취소
      </CmsButton>
      <CmsButton variant="delete" size="large" onClick={onConfirm}>
        배정 취소
      </CmsButton>
    </>
  )

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="배정 취소 안내"
      width={560}
      footer={footer}
      className="school-detail-unassign-confirm-modal"
    >
      <div className="school-detail-unassign-confirm-modal__body">
        <p className="school-detail-unassign-confirm-modal__main">
          {instructorNames.length > 0 ? (
            <>
              [<strong>{schoolName}</strong>]에서{' '}
              {instructorNames.map((name, i) => (
                <span key={`${name}-${i}`}>
                  [<strong>{name}</strong>]{i < instructorNames.length - 1 ? ', ' : ''}
                </span>
              ))}{' '}
              강사님의 배정을 취소하시겠습니까?
            </>
          ) : (
            <>선택한 강사님의 배정을 취소하시겠습니까?</>
          )}
        </p>
      </div>
    </ContentModal>
  )
}
