/**
 * 참여 봉사자 상세 — 정산 현황 탭 (일반 프로그램)
 */

import { useCallback, useMemo, useState } from 'react'
import { Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import type { Program } from '@/types/domain'
import { StatusBadge } from '@/shared/components'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton, ExcelButton } from '@/shared/ui'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { handleError } from '@/shared/utils/error-handler'
import { formatNumberDisplay } from '@/shared/utils'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'
import { getInstructorSettlementStatusLabel } from '@/shared/constants/instructor-settlement-status'
import { lectureProgressAccent } from '@/features/program/general/lib/participating-individual-instructor-lecture-report-display'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  shouldShowVolunteerSettlementDash,
  type ParticipatingVolunteerSettlementApiRow,
} from '@/features/program/general/lib/map-settlement-to-participating-volunteer-settlement-row'
import { useParticipatingVolunteerSettlementList } from '@/features/program/general/hooks/use-participating-volunteer-settlement-list'
import {
  bulkDownloadParticipatingVolunteerPaymentStatements,
  filterParticipatingVolunteerSettlementDownloadRows,
  getParticipatingVolunteerSettlementBulkDownloadErrorMessage,
} from '@/features/program/general/lib/participating-volunteer-settlement-download'
import { volunteerToPaymentStatementInstructorShape } from '@/features/program/general/ui/detail-modal/program-status/participating-volunteer-payment-statement-view-container'
import { useParticipatingInstructorPaymentStatementView } from '@/features/program/general/ui/detail-modal/program-status/participating-instructor-payment-statement-view-container'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import { useProtectedFileDownload } from '@/shared/lib/use-protected-file-download'
import './participating-volunteer-settlement-section.css'

function formatSettlementAmount(amount: number | null): string {
  if (amount == null) return '-'
  return `${formatNumberDisplay(amount)}원`
}

function renderPaymentStatementProcessingStatus(row: ParticipatingVolunteerSettlementApiRow) {
  if (shouldShowVolunteerSettlementDash(row)) return '-'
  return <InstructorSettlementStatusText status={row.paymentStatementStatus} />
}

function resolvePaymentStatementExportLabel(row: ParticipatingVolunteerSettlementApiRow): string {
  if (shouldShowVolunteerSettlementDash(row)) return '-'
  return getInstructorSettlementStatusLabel(row.paymentStatementStatus)
}

function resolveSettlementExportAmount(row: ParticipatingVolunteerSettlementApiRow): string {
  if (shouldShowVolunteerSettlementDash(row)) return '-'
  return formatSettlementAmount(row.scheduledSettlementAmount)
}

const settlementExportColumns: ColumnsType<ParticipatingVolunteerSettlementApiRow> = [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '기관명', dataIndex: 'institutionName', key: 'institutionName' },
  { title: '담당 학년', dataIndex: 'assignedGrade', key: 'assignedGrade' },
  {
    title: '담당 봉사 진행 일정',
    dataIndex: 'volunteerScheduleLabel',
    key: 'volunteerScheduleLabel',
  },
  {
    title: '봉사 진행 현황',
    dataIndex: 'volunteerProgressLabel',
    key: 'volunteerProgressLabel',
  },
  {
    title: '지급조서 처리 현황',
    key: 'paymentStatementStatus',
    render: (_: unknown, record) => resolvePaymentStatementExportLabel(record),
  },
  {
    title: '정산 예정 금액',
    key: 'scheduledSettlementAmount',
    render: (_: unknown, record) => resolveSettlementExportAmount(record),
  },
]

export interface ParticipatingVolunteerSettlementSectionProps {
  volunteer: ParticipatingVolunteerRow
  program: Program
}

export function ParticipatingVolunteerSettlementSection({
  volunteer,
  program,
}: ParticipatingVolunteerSettlementSectionProps) {
  const { showAlert } = useCmsAlert()
  const { runProtectedDownload, filePasswordModal } = useProtectedFileDownload()
  const programId = program?.id != null ? String(program.id) : ''
  const isIndividual = isGeneralIndividualProgram(program)
  const institutionNameOverride = isIndividual
    ? program.mainTitle?.trim() || program.title?.trim() || undefined
    : undefined

  const {
    isLoading,
    rows,
    settlementItems,
    progressSummary,
    paymentStatementSummaryStatus,
    remoteEnabled,
  } = useParticipatingVolunteerSettlementList({
    programId,
    volunteer,
  })

  const displayRows = useMemo(() => {
    if (!institutionNameOverride) return rows
    return rows.map(row => ({
      ...row,
      institutionName:
        !row.institutionName || row.institutionName === '-'
          ? institutionNameOverride
          : row.institutionName,
    }))
  }, [institutionNameOverride, rows])

  /** 지급조서 보기 → 강사와 같은 산출 내역서(확인 처리 = 계좌 지급 예정일 모달) */
  const statementInstructor = useMemo(
    () => volunteerToPaymentStatementInstructorShape(volunteer),
    [volunteer]
  )
  const paymentStatementView = useParticipatingInstructorPaymentStatementView({
    instructor: statementInstructor,
    settlementItems,
    programId,
    programName: program.mainTitle?.trim() || program.title?.trim(),
    hideInstitutionColumn: isIndividual,
  })
  const openPaymentStatement = paymentStatementView.handleOpen
  const handleOpenPaymentStatement = useCallback(
    (record: ParticipatingVolunteerSettlementApiRow) =>
      openPaymentStatement({
        ...record,
        settlementApplicationId:
          settlementItems.find(item => item.settlementId === record.settlementId)
            ?.settlementApplicationId ?? null,
      }),
    [openPaymentStatement, settlementItems]
  )

  const [bulkDownloadLoading, setBulkDownloadLoading] = useState(false)

  const downloadableRows = useMemo(
    () => filterParticipatingVolunteerSettlementDownloadRows(displayRows),
    [displayRows]
  )

  const { exportExcel, isExporting: isExcelExporting } = useTableExcelExport({
    columns: settlementExportColumns,
    data: displayRows,
    filename: '정산 내역',
  })

  const handleBulkDownloadPaymentStatements = useCallback(async () => {
    if (bulkDownloadLoading) return
    if (!remoteEnabled) return
    if (downloadableRows.length === 0) {
      showAlert({
        title: '안내',
        content:
          '다운로드할 지급조서가 없습니다. 지급조서 확인 완료 또는 계좌 지급 완료 상태인 건만 다운로드됩니다.',
      })
      return
    }

    runProtectedDownload({
      kind: 'PAYMENT_STATEMENT',
      download: async password => {
        setBulkDownloadLoading(true)
        try {
          await bulkDownloadParticipatingVolunteerPaymentStatements(
            downloadableRows,
            '지급조서_일괄',
            {
              password,
            }
          )
        } catch (error) {
          handleError(error, {
            context: 'participatingVolunteerSettlementSection.bulkDownloadPaymentStatements',
          })
          showAlert({
            title: '안내',
            content: getParticipatingVolunteerSettlementBulkDownloadErrorMessage(error),
          })
          throw error
        } finally {
          setBulkDownloadLoading(false)
        }
      },
    })
  }, [bulkDownloadLoading, downloadableRows, remoteEnabled, runProtectedDownload, showAlert])

  const columns = useMemo(
    (): ColumnsType<ParticipatingVolunteerSettlementApiRow> => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '기관명',
        dataIndex: 'institutionName',
        key: 'institutionName',
        width: 140,
        align: 'center',
      },
      {
        title: '담당 학년',
        dataIndex: 'assignedGrade',
        key: 'assignedGrade',
        width: 96,
        align: 'center',
      },
      {
        title: '담당 봉사 진행 일정',
        dataIndex: 'volunteerScheduleLabel',
        key: 'volunteerScheduleLabel',
        align: 'center',
        width: 320,
        render: (label: string) =>
          renderProgramDetailPipeSeparated(label ? formatCmsScheduleDisplayLabel(label) : label),
      },
      {
        title: '봉사 진행 현황',
        dataIndex: 'volunteerProgressLabel',
        key: 'volunteerProgressLabel',
        align: 'center',
        width: 120,
        render: (_: unknown, record) => (
          <StatusBadge
            domain="custom"
            label={record.volunteerProgressLabel}
            accentColor={lectureProgressAccent(record.volunteerProgress)}
            variant="text"
          />
        ),
      },
      {
        title: '지급조서 처리 현황',
        key: 'paymentStatementStatus',
        align: 'center',
        width: 160,
        render: (_: unknown, record) => renderPaymentStatementProcessingStatus(record),
      },
      {
        title: '정산 예정 금액',
        key: 'scheduledSettlementAmount',
        align: 'center',
        width: 140,
        render: (_: unknown, record) => (
          <span className="participating-volunteer-settlement-section__amount-dash">
            {resolveSettlementExportAmount(record)}
          </span>
        ),
      },
      {
        title: '지급조서',
        key: 'paymentStatement',
        align: 'center',
        width: 180,
        render: (_: unknown, record) => (
          <div className="participating-volunteer-settlement-section__payment-statement-cell-inner">
            <CmsButton
              variant="default"
              style={{ width: '100%' }}
              size="h32"
              disabled={!remoteEnabled}
              onClick={() => handleOpenPaymentStatement(record)}
            >
              지급조서 보기
            </CmsButton>
          </div>
        ),
      },
    ],
    [handleOpenPaymentStatement, remoteEnabled]
  )

  return (
    <div className="school-detail-fullpage-view__instructor-section participating-volunteer-settlement-section">
      <div className="program-detail-fullpage-modal__info-tab-block participating-volunteer-settlement-section__summary">
        <DetailInfoForm title="정산 현황" mode="view">
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="지급조서 처리 현황"
              view={<InstructorSettlementStatusText status={paymentStatementSummaryStatus} />}
              readOnlyDisplay
            />
            <DetailInfoForm.Field
              label="프로그램 진행 회차"
              view={`${progressSummary.completed} / ${progressSummary.total}건 (봉사 진행 회차 기준)`}
              readOnlyDisplay
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>

      <div className="table-header-actions">
        <div className="table-header-title--wrapper">
          <span className="table-title">정산 내역</span>
          <span className="table-description">{displayRows.length}건</span>
        </div>
        <div className="info-section-buttons--wrapper">
          <CmsButton
            variant="secondary"
            size="h40"
            icon={<ButtonDownloadIcon />}
            disabled={!remoteEnabled || bulkDownloadLoading || downloadableRows.length === 0}
            onClick={() => void handleBulkDownloadPaymentStatements()}
          >
            지급조서 일괄 다운로드
          </CmsButton>
          <ExcelButton
            onClick={exportExcel}
            loading={isExcelExporting}
            disabled={displayRows.length === 0}
          />
        </div>
      </div>

      <div className="participating-institutions-section__table-wrap">
        <Spin spinning={isLoading}>
          <CmsDataTable<ParticipatingVolunteerSettlementApiRow>
            className="participating-institutions-section__table cms-data-table"
            rowKey="id"
            size="middle"
            pagination={false}
            scroll={{ x: 1400 }}
            columns={columns}
            dataSource={displayRows}
          />
        </Spin>
      </div>

      {paymentStatementView.modal}
      {filePasswordModal}
    </div>
  )
}
