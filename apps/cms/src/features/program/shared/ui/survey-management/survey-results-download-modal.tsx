import { useCallback, useEffect, useState } from 'react'
import { ContentModal, CmsButton } from '@/shared/ui'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { GENERAL_SURVEY_POLL_DOWNLOAD_MODAL_COPY } from '../../lib/survey-management/survey-copy'
import type { SurveyResultsDownloadModalCopy } from '../../lib/survey-management/survey-copy'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import './survey-results-download-modal.css'

export type SurveyResultsDownloadFormat = 'excel' | 'pdf'

export type SurveyResultsDownloadModalProps = {
  open: boolean
  downloading?: boolean
  copy?: SurveyResultsDownloadModalCopy
  /**
   * `general` — 일반 프로그램 시안(4197:78883): 「파일 형식 *」, 기본 미선택(선택 전 다운로드 비활성), 다운로드 버튼 아이콘 없음.
   * 생략(`default`) 시 기존 동작(엑셀 기본 선택·아이콘) — UJAT.
   */
  variant?: 'default' | 'general'
  onCancel: () => void
  onDownload: (format: SurveyResultsDownloadFormat) => void | Promise<void>
}

export function SurveyResultsDownloadModal({
  open,
  downloading = false,
  copy = GENERAL_SURVEY_POLL_DOWNLOAD_MODAL_COPY,
  variant = 'default',
  onCancel,
  onDownload,
}: SurveyResultsDownloadModalProps) {
  const generalVariant = variant === 'general'
  const initialFormat: SurveyResultsDownloadFormat | null = generalVariant ? null : 'excel'
  const [format, setFormat] = useState<SurveyResultsDownloadFormat | null>(initialFormat)

  useEffect(() => {
    if (!open) return
    setFormat(initialFormat)
  }, [initialFormat, open])

  const handleCancel = useCallback(() => {
    if (downloading) return
    onCancel()
  }, [downloading, onCancel])

  const handleDownload = useCallback(() => {
    if (downloading || format == null) return
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
            type="button"
            onClick={handleCancel}
            disabled={downloading} >
            {copy.cancelButton}
          </CmsButton>
          <CmsButton
            variant="primary"
            size="medium"
            type="button"
            {...(generalVariant ? {} : { icon: <ButtonDownloadIcon /> })}
            adminAction="download"
            loading={downloading}
            disabled={format == null}
            onClick={handleDownload} >
            {copy.downloadButton}
          </CmsButton>
        </div>
      }
    >
      <div className="survey-results-download-modal__form">
        <div className="survey-results-download-modal__field">
          {generalVariant ? null : (
            <span className="survey-results-download-modal__label">파일 형식</span>
          )}
          <CmsRadioGroup
            {...(generalVariant ? { label: '파일 형식', required: true, size: 'medium' as const } : {})}
            value={format ?? undefined}
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
