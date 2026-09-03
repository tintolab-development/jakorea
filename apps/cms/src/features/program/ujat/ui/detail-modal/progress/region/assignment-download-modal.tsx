import { useCallback, useEffect, useMemo, useState } from 'react'
import { DownloadOutlined } from '@ant-design/icons'
import { ContentModal, CmsButton, useCmsAlert } from '@/shared/ui'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { RegionAssignmentTableData } from './types'
import './assignment-download-modal.css'

const MODAL_Z_INDEX = 1100

export type RegionAssignmentDownloadModalProps = {
  open: boolean
  data: RegionAssignmentTableData
  onCancel: () => void
}

export function RegionAssignmentDownloadModal({
  open,
  data,
  onCancel,
}: RegionAssignmentDownloadModalProps) {
  const { showAlert } = useCmsAlert()
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>([])
  const [exporting, setExporting] = useState(false)

  const educationDateOptions = useMemo(
    () =>
      data.columns.map(column => ({
        value: column.id,
        label: `${column.dateLabel} (${column.institutionName})`,
      })),
    [data.columns]
  )

  useEffect(() => {
    if (!open) return
    setSelectedColumnIds([])
    setExporting(false)
  }, [open])

  const handleCancel = useCallback(() => {
    if (exporting) return
    setSelectedColumnIds([])
    onCancel()
  }, [exporting, onCancel])

  const handleDownload = useCallback(async () => {
    if (exporting || selectedColumnIds.length === 0) return

    try {
      setExporting(true)
      const { exportRegionAssignmentExcel } = await import('./export-region-assignment-excel')
      await exportRegionAssignmentExcel(data, selectedColumnIds)
      setSelectedColumnIds([])
      onCancel()
    } catch {
      showAlert({
        title: '엑셀 다운로드',
        content: '엑셀 파일 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setExporting(false)
    }
  }, [data, exporting, onCancel, selectedColumnIds, showAlert])

  const footer = (
    <div className="ujat-region-assignment-download-modal__footer">
      <CmsButton variant="secondary" size="medium" width={120} onClick={handleCancel}>
        취소
      </CmsButton>
      <CmsButton
        variant="primary"
        size="medium"
        width={140}
        icon={<DownloadOutlined />}
        adminAction="download"
        disabled={selectedColumnIds.length === 0 || exporting}
        onClick={() => void handleDownload()}
      >
        엑셀 다운로드
      </CmsButton>
    </div>
  )

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title="배정표 다운로드"
      width={600}
      zIndex={MODAL_Z_INDEX}
      className="ujat-region-assignment-download-modal"
      wrapClassName="ujat-region-assignment-download-modal-wrap"
      footer={footer}
      description="표기할 교육 진행일정을 선택해 주세요."
    >
      <div className="ujat-region-assignment-download-modal__form">
        <div className="ujat-region-assignment-download-modal__field">
          <span className="ujat-region-assignment-download-modal__label">교육 진행일정</span>
          <CmsSelect
            mode="multiple"
            inputSize="large"
            width="100%"
            withAllOption={false}
            allowClear
            placeholder="파일에 표기할 교육 진행 일정을 선택해 주세요"
            value={selectedColumnIds}
            options={educationDateOptions}
            onChange={value => {
              const next = Array.isArray(value) ? value.map(String) : []
              setSelectedColumnIds(next)
            }}
            aria-label="교육 진행일정"
          />
        </div>
      </div>
    </ContentModal>
  )
}
