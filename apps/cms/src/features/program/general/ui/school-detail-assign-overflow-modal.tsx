/**
 * 강사 배정 인원 초과 안내 모달
 * 최대 배정 인원이 이미 찬 상태에서 추가 배정 시도 시 노출. 인원 외 추가 배정 여부 확인.
 */

import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
import './school-detail-assign-overflow-modal.css'

export interface SchoolDetailAssignOverflowModalProps {
  open: boolean
  onCancel: () => void
  /** 최대 배정 인원 수 (예: 4) */
  requiredCount: number
  /**
   * 단일 강사명 (추가 배정 시): "[강사명] 강사님을 인원 외로 추가 배정하시겠습니까?"
   * 미전달 시: variant가 'add'면 "인원 외로 추가 배정을 진행하시겠습니까?", 'select'면 "선택한 강사님들을 인원 외로 추가 배정하시겠습니까?"
   */
  instructorName?: string
  /** 'add': 추가 배정(단일) 플로우, 'select': 선택 배정 플로우. instructorName 없을 때 문구 분기용 */
  variant?: 'add' | 'select'
  /** "강사 배정" 클릭 시 호출 (인원 외 추가 배정 진행) */
  onConfirm: () => void
}

export function SchoolDetailAssignOverflowModal({
  open,
  onCancel,
  requiredCount,
  instructorName,
  variant = 'select',
  onConfirm,
}: SchoolDetailAssignOverflowModalProps) {
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
      title="강사 배정 인원 초과 안내"
      width={560}
      footer={footer}
      className="school-detail-assign-overflow-modal"
    >
      <div className="school-detail-assign-overflow-modal__body">
        <p className="school-detail-assign-overflow-modal__line">
          현재 최대 배정 인원({requiredCount}명)이 모두 배정된 상태입니다.
        </p>
        <p className="school-detail-assign-overflow-modal__line">
          {instructorName != null && instructorName !== '' ? (
            <>
              [<strong>{instructorName}</strong>] 강사님을 인원 외로 추가 배정하시겠습니까?
            </>
          ) : variant === 'add' ? (
            <>인원 외로 추가 배정을 진행하시겠습니까?</>
          ) : (
            <>선택한 강사님들을 인원 외로 추가 배정하시겠습니까?</>
          )}
        </p>
      </div>
    </ContentModal>
  )
}
