/**
 * 과제 미리보기 모달
 * 과제 제출 내역 모달 > "과제 보기" 클릭 시 노출. 1400×880, 미리보기 영역 임시 배경 #E3E3E3
 */

import { DownloadOutlined } from '@ant-design/icons'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui'
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
  downloadLoading?: boolean
}

export function AssignmentPreviewModal({
  open,
  onCancel,
  studentName,
  roundNumber,
  onDownload,
  downloadLoading = false,
}: AssignmentPreviewModalProps) {
  const footer = (
    <>
      <CmsButton
        variant="secondary"
        size="medium"
        width={120}
        className="cms-button--footer-auto assignment-preview-modal__footer-btn assignment-preview-modal__footer-btn--close"
        onClick={onCancel}
      >
        닫기
      </CmsButton>
      <CmsButton
        variant="primary"
        size="medium"
        icon={<DownloadOutlined />}
        loading={downloadLoading}
        disabled={onDownload == null}
        onClick={() => onDownload?.()}
        className="cms-button--footer-auto assignment-preview-modal__footer-btn assignment-preview-modal__footer-btn--download"
      >
        파일 다운로드
      </CmsButton>
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
