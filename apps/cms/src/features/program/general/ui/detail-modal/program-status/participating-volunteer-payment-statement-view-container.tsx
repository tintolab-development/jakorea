import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import type { ParticipatingVolunteerSettlementApiRow } from '@/features/program/general/lib/map-settlement-to-participating-volunteer-settlement-row'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'
import {
  downloadPaymentStatementRemote,
  fetchSettlementDetailRemote,
} from '@/features/settlement-management/api/settlement-api-client'
import { getSettlementApiErrorMessage } from '@/features/settlement-management/api/get-settlement-api-error'
import { buildPaymentStatementPreviewOptionsFromSettlement } from '@/features/program/general/lib/map-settlement-to-payment-statement-preview-options'
import {
  PAYMENT_STATEMENT_ISSUANCE_DOCUMENT_TITLE,
} from '@/features/program/general/lib/participating-instructor-payment-statement-issuance-view'
import { PaymentStatementIssuanceViewModal } from '@/features/program/shared/ui/payment-statement-issuance-view-modal'
import { downloadFromBulkEndpoint } from '@/features/user/api/download-bulk-endpoint'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'

function sanitizeFileNamePart(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, '_').trim()
}

function volunteerToPaymentStatementInstructorShape(
  volunteer: ParticipatingVolunteerRow
): ParticipatingInstructorRow {
  return {
    id: volunteer.id,
    no: volunteer.no,
    instructorName: volunteer.volunteerName,
    schoolName: volunteer.affiliation?.trim() || '',
    educationGrade: '-',
    classCount: 0,
    studentCount: 0,
    lectureRound: '',
    settlementStatus: 'none',
    teacherName: '',
    memberId: volunteer.memberId != null ? String(volunteer.memberId) : undefined,
    contact: volunteer.contact,
    email: volunteer.email,
    affiliation: volunteer.affiliation,
    affiliationOrganizationId: volunteer.affiliationOrganizationId,
  }
}

function buildVolunteerPaymentStatementFileName(
  volunteer: ParticipatingVolunteerRow,
  row: ParticipatingVolunteerSettlementApiRow,
  institutionNameOverride?: string
): string {
  const sessionMatch = row.volunteerScheduleLabel.match(/\|\s*(\d+)회차/)
  const sessionPart = sessionMatch ? `${sessionMatch[1]}회차` : '정산'
  const schoolName = institutionNameOverride?.trim() || row.institutionName
  return [
    PAYMENT_STATEMENT_ISSUANCE_DOCUMENT_TITLE,
    sanitizeFileNamePart(schoolName),
    sanitizeFileNamePart(volunteer.volunteerName),
    sanitizeFileNamePart(sessionPart),
  ].join('_')
}

export function useParticipatingVolunteerPaymentStatementView(input: {
  volunteer: ParticipatingVolunteerRow
  settlementItems: SettlementListItemResponse[]
  institutionNameOverride?: string
}) {
  const { showAlert } = useCmsAlert()
  const [open, setOpen] = useState(false)
  const [activeRow, setActiveRow] = useState<ParticipatingVolunteerSettlementApiRow | null>(null)
  const [downloadLoading, setDownloadLoading] = useState(false)

  const instructorShape = useMemo(
    () => volunteerToPaymentStatementInstructorShape(input.volunteer),
    [input.volunteer]
  )

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
    queryKey: ['participating-volunteer-settlement-detail', activeRow?.settlementId],
    enabled: open && activeRow?.settlementId != null,
    queryFn: () => fetchSettlementDetailRemote(activeRow!.settlementId),
    retry: false,
  })

  const paragraphBodyOptions = useMemo(() => {
    if (!activeRow || !listItem || !detailQuery.data) return undefined
    return buildPaymentStatementPreviewOptionsFromSettlement({
      instructor: instructorShape,
      listItem,
      detail: detailQuery.data,
      institutionName: input.institutionNameOverride,
    })
  }, [
    activeRow,
    detailQuery.data,
    input.institutionNameOverride,
    instructorShape,
    listItem,
  ])

  const fileName = useMemo(() => {
    if (!activeRow) return undefined
    return buildVolunteerPaymentStatementFileName(
      input.volunteer,
      activeRow,
      input.institutionNameOverride
    )
  }, [activeRow, input.institutionNameOverride, input.volunteer])

  const handleOpen = useCallback((row: ParticipatingVolunteerSettlementApiRow) => {
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
