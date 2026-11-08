import { useCallback, useState } from 'react'
import { CmsButton } from '@/shared/ui/cms-button'
import { useCmsAlert } from '@/shared/ui'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import { downloadUjatEducationProgressSummaryExcel } from './export-summary-excel'
import { useUjatEducationProgressSummary } from './use-summary'

export function UjatEducationProgressSummaryExcelButton({
  programId,
}: {
  programId?: string | null
}) {
  const { showAlert } = useCmsAlert()
  const [downloading, setDownloading] = useState(false)
  const { columnRegions, schoolSummary, volunteerSummary, loading, isError, isRemote } =
    useUjatEducationProgressSummary(programId)

  const handleDownload = useCallback(async () => {
    if (!isRemote || isError || loading) return
    setDownloading(true)
    try {
      await downloadUjatEducationProgressSummaryExcel({
        regions: columnRegions,
        schoolSummary,
        volunteerSummary,
      })
    } catch {
      showAlert({
        title: '엑셀 다운로드',
        content: '엑셀 파일 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setDownloading(false)
    }
  }, [columnRegions, isError, isRemote, loading, schoolSummary, showAlert, volunteerSummary])

  return (
    <CmsButton
      variant="primary"
      size="h44"
      icon={<ButtonDownloadIcon />}
      loading={downloading}
      disabled={!isRemote || isError || loading}
      onClick={() => {
        void handleDownload()
      }}
    >
      엑셀 다운로드
    </CmsButton>
  )
}
