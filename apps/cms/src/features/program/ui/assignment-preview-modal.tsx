/**
 * 과제 미리보기 모달
 * 과제 제출 내역 모달 > "과제 보기" 클릭 시 노출. 1400×880, 미리보기 영역 임시 배경 #E3E3E3
 */

import { DownloadOutlined } from '@ant-design/icons'
import { ContentModal } from '@/shared/ui/content-modal'
import { AppButton } from '@/shared/ui/app-button'
import './assignment-preview-modal.css'

export interface AssignmentPreviewModalProps {
  open: boolean
  onCancel: () => void
  /** 학생명 (예: 최학생) */
  studentName: string
  /** 회차 번호 (예: 1) */
  roundNumber: number
  /** 파일 다운로드 클릭 시 (선택) */
  onDownload?: () => void
}

export function AssignmentPreviewModal({
  open,
  onCancel,
  studentName,
  roundNumber,
  onDownload,
}: AssignmentPreviewModalProps) {
  const footer = (
    <>
      <AppButton variant="cancel" size="large" onClick={onCancel}>
        닫기
      </AppButton>
      <AppButton
        variant="primary"
        size="large"
        modalTeal
        icon={<DownloadOutlined />}
        onClick={() => onDownload?.()}
        className="assignment-preview-modal__btn-download"
      >
        파일 다운로드
      </AppButton>
    </>
  )

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="과제 미리보기"
      size="large"
      width={1400}
      footer={footer}
      className="assignment-preview-modal"
    >
      <div className="assignment-preview-modal__body">
        <p className="assignment-preview-modal__description">
          <span className="assignment-preview-modal__description-name">[{studentName}]</span>
          <span className="assignment-preview-modal__description-text">
            {' '}
            학생의 {roundNumber}회차 과제입니다.
          </span>
        </p>
        <div className="assignment-preview-modal__preview" aria-label="과제 미리보기 영역">
          {/* 이미지/파일 미리보기 임시 placeholder */}
        </div>
      </div>
    </ContentModal>
  )
}
