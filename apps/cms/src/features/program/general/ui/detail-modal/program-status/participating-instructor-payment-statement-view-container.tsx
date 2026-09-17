import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { ParticipatingInstructorSettlementApiRow } from '@/features/program/general/lib/map-settlement-to-participating-instructor-settlement-row'
import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'
import {
  downloadPaymentStatementRemote,
  fetchSettlementDetailRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import { getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'
import { buildPaymentStatementPreviewOptionsFromSettlement } from '@/features/program/general/lib/map-settlement-to-payment-statement-preview-options'
import {
  buildPaymentStatementIssuancePreviewFileName,
  buildPaymentStatementIssuancePreviewContext,
} from '@/features/program/general/lib/participating-instructor-payment-statement-issuance-view'
import { PaymentStatementIssuanceViewModal } from '@/features/program/shared/ui/payment-statement-issuance-view-modal'
import { downloadFromBulkEndpoint } from '@/features/user/api/download-bulk-endpoint'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'

function toSettlementContext(
  row: ParticipatingInstructorSettlementApiRow,
  institutionNameOverride?: string
) {
  return {
    id: row.id,
    schoolName: institutionNameOverride?.trim() || row.institutionName,
    educationScheduleLabel: row.educationScheduleLabel,
    scheduledSettlementAmount: row.scheduledSettlementAmount,
  }
}

export function useParticipatingInstructorPaymentStatementView(input: {
  instructor: ParticipatingInstructorRow
  settlementItems: SettlementListItemResponse[]
  institutionNameOverride?: string
}) {
  const { showAlert } = useCmsAlert()
  const [open, setOpen] = useState(false)
  const [activeRow, setActiveRow] = useState<ParticipatingInstructorSettlementApiRow | null>(null)
  const [downloadLoading, setDownloadLoading] = useState(false)

  const listItem = useMemo((): SettlementListItemResponse | null => {
    if (!activeRow) return null
    return (
      input.settlementItems.find(item => item.settlementId === activeRow.settlementId) ?? {
        settlementId: activeRow.settlementId,
        institutionName: activeRow.institutionName,
        netPaymentAmount: activeRow.scheduledSettlementAmount ?? undefined,
        grossAmount: activeRow.scheduledSettlementAmount ?? undefined,
      }
    )
  }, [activeRow, input.settlementItems])

  const detailQuery = useQuery({
    queryKey: ['participating-instructor-settlement-detail', activeRow?.settlementId],
    enabled: open && activeRow?.settlementId != null,
    queryFn: () => fetchSettlementDetailRemote(activeRow!.settlementId),
    retry: false,
  })

  const paragraphBodyOptions = useMemo(() => {
    if (!activeRow || !listItem || !detailQuery.data) return undefined
    return buildPaymentStatementPreviewOptionsFromSettlement({
      instructor: input.instructor,
      listItem,
      detail: detailQuery.data,
      institutionName: input.institutionNameOverride,
    })
  }, [activeRow, detailQuery.data, input.instructor, input.institutionNameOverride, listItem])

  const fileName = useMemo(() => {
    if (!activeRow) return undefined
    return buildPaymentStatementIssuancePreviewFileName(
      buildPaymentStatementIssuancePreviewContext(
        input.instructor,
        toSettlementContext(activeRow, input.institutionNameOverride)
      )
    )
  }, [activeRow, input.instructor, input.institutionNameOverride])

  const handleOpen = useCallback((row: ParticipatingInstructorSettlementApiRow) => {
    setActiveRow(row)
    setOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    setActiveRow(null)
  }, [])

  useEffect(() => {
    if (!open || !detailQuery.isError) return
    showAlert({
      title: '안내',
      content: getSettlementApiErrorMessage(
        detailQuery.error,
        '지급조서 미리보기를 불러오지 못했습니다.'
      ),
    })
    handleClose()
  }, [detailQuery.error, detailQuery.isError, handleClose, open, showAlert])

  const handleDownloadPdf = useCallback(async () => {
    if (!activeRow || downloadLoading) return
    setDownloadLoading(true)
    try {
      const response = await downloadPaymentStatementRemote(activeRow.settlementId)
      if (response.downloadUrl) {
        await downloadFromBulkEndpoint(
          response.downloadUrl,
          fileName ?? `지급조서_${activeRow.settlementId}`,
          'pdf'
        )
        return
      }
      showAlert({
        title: '안내',
        content: '다운로드 URL을 받지 못했습니다. 잠시 후 다시 시도해 주세요.',
      })
    } catch (error) {
      showAlert({
        title: '안내',
        content: getSettlementApiErrorMessage(error, '지급조서 다운로드에 실패했습니다.'),
      })
    } finally {
      setDownloadLoading(false)
    }
  }, [activeRow, downloadLoading, fileName, showAlert])

  const modal = (
    <PaymentStatementIssuanceViewModal
      open={open && Boolean(paragraphBodyOptions)}
      onClose={handleClose}
      paragraphBodyOptions={paragraphBodyOptions}
      fileName={fileName}
      onDownloadPdf={handleDownloadPdf}
      downloadLoading={downloadLoading}
    />
  )

  return {
    open,
    activeRow,
    detailLoading: detailQuery.isPending,
    handleOpen,
    handleClose,
    modal,
  }
}
