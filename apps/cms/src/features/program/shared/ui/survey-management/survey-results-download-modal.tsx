import { useCallback, useEffect, useState } from 'react'
import { DownloadOutlined } from '@ant-design/icons'
import { ContentModal, CmsButton } from '@/shared/ui'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { GENERAL_SURVEY_POLL_DOWNLOAD_MODAL_COPY } from '../../lib/survey-management/survey-copy'
import type { SurveyResultsDownloadModalCopy } from '../../lib/survey-management/survey-copy'
import './survey-results-download-modal.css'

export type SurveyResultsDownloadFormat = 'excel' | 'pdf'

export type SurveyResultsDownloadModalProps = {
  open: boolean
  downloading?: boolean
  copy?: SurveyResultsDownloadModalCopy
  onCancel: () => void
  onDownload: (format: SurveyResultsDownloadFormat) => void | Promise<void>
}

export function SurveyResultsDownloadModal({
  open,
  downloading = false,
  copy = GENERAL_SURVEY_POLL_DOWNLOAD_MODAL_COPY,
  onCancel,
  onDownload,
}: SurveyResultsDownloadModalProps) {
  const [format, setFormat] = useState<SurveyResultsDownloadFormat>('excel')

  useEffect(() => {
    if (!open) return
    setFormat('excel')
  }, [open])

  const handleCancel = useCallback(() => {
    if (downloading) return
    onCancel()
  }, [downloading, onCancel])

  const handleDownload = useCallback(() => {
    if (downloading) return
    void onDownload(format)
  }, [downloading, format, onDownload])

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title={copy.title}
      width={600}
      className="survey-results-download-modal"
      description={copy.description}
      footer={
        <div className="survey-results-download-modal__footer">
          <CmsButton
            variant="secondary"
            size="medium"
            width={120}
            type="button"
            onClick={handleCancel}
            disabled={downloading}
          >
            {copy.cancelButton}
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            width={140}
            type="button"
            icon={<DownloadOutlined />}
            loading={downloading}
            onClick={handleDownload}
          >
            {copy.downloadButton}
          </CmsButton>
        </div>
      }
    >
      <div className="survey-results-download-modal__form">
        <div className="survey-results-download-modal__field">
          <span className="survey-results-download-modal__label">파일 형식</span>
          <CmsRadioGroup
            value={format}
            onChange={event => setFormat(event.target.value as SurveyResultsDownloadFormat)}
          >
            <CmsRadio value="excel">{copy.excelLabel}</CmsRadio>
            <CmsRadio value="pdf">{copy.pdfLabel}</CmsRadio>
          </CmsRadioGroup>
        </div>
      </div>
    </ContentModal>
  )
}
