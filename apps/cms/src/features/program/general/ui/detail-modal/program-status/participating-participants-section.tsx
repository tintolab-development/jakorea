/**
 * 참여자(개인) 페이지 (풀페이지 모달 > 프로그램 진행 현황 > 참여자)
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Table, Spin } from 'antd'
import { CalendarOutlined, DownloadOutlined, UnorderedListOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsButton, useCmsAlert, CMS_CERTIFICATE_ISSUE_BUTTON_WIDTH } from '@/shared/ui'
import {
  STUDENT_CERTIFICATE_ISSUE_SELECT_ONE_ALERT_MESSAGE,
  STUDENT_CERTIFICATE_ISSUE_SELECT_ONLY_ONE_ALERT_MESSAGE,
} from '@/shared/constants/messages'
import type { ParticipatingIndividualParticipantRow } from '@/data/mock/participating-individual-participants'
import { participatingIndividualParticipantsFilterFields } from '@/features/program/general/lib/participating-individual-participants-filter-fields'
import {
  filterParticipatingIndividualParticipants,
  type ParticipatingIndividualParticipantsFilters,
} from '@/features/program/general/lib/participating-individual-participants-filter'
import { useParticipatingIndividualParticipantsParams } from '@/features/program/general/hooks/use-participating-individual-participants-params'
import { useProgressIndividualParticipantList } from '@/features/program/general/hooks/use-progress-individual-participant-list'
import { normalizeGeneralSurveyMenuKeys } from '@/features/program/general/lib/general-survey-menu-keys'
import {
  PARTICIPATING_INDIVIDUAL_PARTICIPANTS_TABLE_MIN_SCROLL_X,
  useParticipatingIndividualParticipantColumns,
} from '@/features/program/general/lib/participating-individual-participant-columns'
import { resolveInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { buildParticipatingParticipantCertificateContext } from '@/features/program/general/lib/participating-individual-participant-certificate'
import { isWithinStudentCertificateIssuancePeriod } from '@/features/program/general/lib/resolve-student-certificate-kind'
import { CertificateBulkIssueReasonModal } from '@/features/user/detail/ui/modal/certificate-bulk-issue-reason-modal'
import type { CertificateIssueReasonValue } from '@/features/user/detail/ui/modal/certificate-bulk-issue-reason-modal'
import { FormCertificatePdfExportOverlay } from '@/pages/templates/form-certificate-pdf-export-overlay'
import { handleError } from '@/shared/utils/error-handler'
import type { StudentCertificateDownloadContext } from '@/features/program/general/lib/build-student-certificate-issuance'
import type { Program } from '@/types/domain'
import { ParticipatingParticipantFullpageView, type ParticipantDetailTabKey } from './participating-participant-fullpage-view'
import { ParticipatingParticipantsCalendarView } from './participating-participants-calendar-view'
import { StudentCertificatePdfExportHost } from './student-certificate-pdf-export-host'
import './participating-institutions-section.css'
import './program-progress-tab.css'

export interface ParticipatingParticipantsSectionProps {
  programId?: string
  program?: Program | null
  participantIdFromUrl?: string | null
  participantTabFromUrl?: ParticipantDetailTabKey
  onParticipantTabChange?: (tab: ParticipantDetailTabKey) => void
  onParticipantRowClick?: (row: ParticipatingIndividualParticipantRow) => void
  onClearParticipantId?: () => void
  onParticipantDetailOpen?: (participantName: string) => void
  onParticipantDetailClose?: () => void
}

export function ParticipatingParticipantsSection({
  programId,
  program,
  participantIdFromUrl,
  participantTabFromUrl = 'application',
  onParticipantTabChange,
  onParticipantRowClick,
  onClearParticipantId,
  onParticipantDetailOpen,
  onParticipantDetailClose,
}: ParticipatingParticipantsSectionProps) {
  const { showAlert } = useCmsAlert()
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const [tableScrollX, setTableScrollX] = useState(
    PARTICIPATING_INDIVIDUAL_PARTICIPANTS_TABLE_MIN_SCROLL_X
  )
  const {
    filters,
    appliedFilters,
    applyFilters,
    viewMode,
    setViewMode,
    progressCalendarGranularity,
    setProgressCalendarGranularity,
  } = useParticipatingIndividualParticipantsParams()
  const { participantList, loading: participantsLoading } =
    useProgressIndividualParticipantList(programId)
  const programBridge = useMemo(
    () => resolveInstitutionApplicationProgramBridge(program),
    [program]
  )
  const columns = useParticipatingIndividualParticipantColumns(programBridge)

  const [pendingFilters, setPendingFilters] = useState<ParticipatingIndividualParticipantsFilters>(
    () => ({ ...filters })
  )
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [certificateIssueModalOpen, setCertificateIssueModalOpen] = useState(false)
  const [certificateExportContext, setCertificateExportContext] =
    useState<StudentCertificateDownloadContext | null>(null)
  const [certificateExportActive, setCertificateExportActive] = useState(false)

  const hasStudentSatisfactionSurvey = useMemo(
    () =>
      normalizeGeneralSurveyMenuKeys(program?.generalSurveyMenuKeys ?? []).includes('satisfaction'),
    [program?.generalSurveyMenuKeys]
  )

  useEffect(() => {
    setPendingFilters({ ...filters })
  }, [filters])

  useLayoutEffect(() => {
    const el = tableWrapRef.current
    if (!el) return
    const minW = PARTICIPATING_INDIVIDUAL_PARTICIPANTS_TABLE_MIN_SCROLL_X
    const update = () => {
      const w = el.getBoundingClientRect().width
      setTableScrollX(Math.max(minW, Math.floor(w)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [viewMode])

  const filteredParticipants = useMemo(
    () => filterParticipatingIndividualParticipants(participantList, appliedFilters),
    [participantList, appliedFilters]
  )

  const selectedParticipantFromUrl = useMemo(() => {
    if (!participantIdFromUrl || !programId) return null
    return participantList.find(row => row.id === participantIdFromUrl) ?? null
  }, [participantIdFromUrl, programId, participantList])

  useEffect(() => {
    if (participantIdFromUrl && selectedParticipantFromUrl) {
      onParticipantDetailOpen?.(selectedParticipantFromUrl.applicantName)
    } else {
      onParticipantDetailClose?.()
    }
  }, [
    participantIdFromUrl,
    selectedParticipantFromUrl,
    onParticipantDetailOpen,
    onParticipantDetailClose,
  ])

  const filterTableValues = useMemo(
    () => ({
      participantName: pendingFilters.participantName,
      educationGrade:
        pendingFilters.educationGrade === 'all' ? '' : pendingFilters.educationGrade,
      homeSido: pendingFilters.homeSido,
      homeSigungu: pendingFilters.homeSigungu,
    }),
    [pendingFilters]
  )

  const handleFilterChange = (key: string, value: unknown) => {
    if (key === 'participantName') {
      setPendingFilters(prev => ({ ...prev, participantName: String(value ?? '') }))
      return
    }
    if (key === 'homeSido') {
      setPendingFilters(prev => ({
        ...prev,
        homeSido: value == null || value === '' ? '' : String(value),
        homeSigungu: '',
      }))
      return
    }
    if (key === 'homeSigungu') {
      setPendingFilters(prev => ({
        ...prev,
        homeSigungu: value == null || value === '' ? '' : String(value),
      }))
      return
    }
    if (key === 'educationGrade') {
      const v = value == null || value === '' || value === 'all' ? 'all' : String(value)
      setPendingFilters(prev => ({ ...prev, educationGrade: v }))
    }
  }

  const handleFilterSearch = () => {
    applyFilters(pendingFilters)
  }

  const handleCertificateIssueClick = useCallback(() => {
    const selectedCount = selectedRowKeys.length
    if (selectedCount === 0) {
      showAlert({ title: '안내', content: STUDENT_CERTIFICATE_ISSUE_SELECT_ONE_ALERT_MESSAGE })
      return
    }
    if (selectedCount > 1) {
      showAlert({
        title: '안내',
        content: STUDENT_CERTIFICATE_ISSUE_SELECT_ONLY_ONE_ALERT_MESSAGE,
      })
      return
    }
    if (certificateExportActive || program == null) return

    const selectedId = String(selectedRowKeys[0])
    const participant = filteredParticipants.find(row => row.id === selectedId)
    if (participant == null) return

    if (!isWithinStudentCertificateIssuancePeriod(participant.participationAppliedAt)) {
      return
    }

    setCertificateIssueModalOpen(true)
  }, [
    certificateExportActive,
    filteredParticipants,
    program,
    selectedRowKeys,
    showAlert,
  ])

  const handleCertificateIssueModalCancel = useCallback(() => {
    setCertificateIssueModalOpen(false)
  }, [])

  const handleCertificateIssueConfirm = useCallback(
    (_reason: CertificateIssueReasonValue, reasonLabel: string) => {
      if (program == null) return

      const selectedId = String(selectedRowKeys[0])
      const participant = filteredParticipants.find(row => row.id === selectedId)
      if (participant == null) return

      setCertificateExportContext(
        buildParticipatingParticipantCertificateContext({
          participant,
          program,
          hasStudentSatisfactionSurvey,
          issuanceReasonLabel: reasonLabel,
        })
      )
      setCertificateExportActive(true)
    },
    [filteredParticipants, hasStudentSatisfactionSurvey, program, selectedRowKeys]
  )

  const handleCertificateExportComplete = useCallback((success: boolean) => {
    setCertificateExportContext(null)
    setCertificateExportActive(false)
    if (!success) {
      handleError(new Error('participant certificate pdf export failed'), {
        context: 'participatingParticipantsSection.certificateDownload',
      })
    }
  }, [])

  const excelColumns = useMemo((): ColumnsType<ParticipatingIndividualParticipantRow> => {
    return columns.map(column => {
      if (column.key === 'sessions') {
        return {
          ...column,
          render: (_: unknown, record: ParticipatingIndividualParticipantRow) => {
            const sessions = record.sessions ?? []
            if (sessions.length === 0) return '-'
            return sessions
              .map(session => {
                const date = session.date?.replace(/\./g, '. ') ?? ''
                const time = session.timeRange?.replace('~', ' ~ ') ?? ''
                const round = session.classNum ?? (session.round ? `${session.round}차시` : '')
                return [date, time, round].filter(Boolean).join(' | ')
              })
              .join('\n')
          },
        }
      }
      return column
    })
  }, [columns])

  if (participantsLoading && participantList.length === 0) {
    return (
      <div className="flex min-h-[240px] w-full items-center justify-center" role="status">
        <Spin size="large" />
      </div>
    )
  }

  if (participantIdFromUrl && selectedParticipantFromUrl && program) {
    return (
      <div className="program-status-participating participating-participants-section">
        <ParticipatingParticipantFullpageView
          program={program}
          participant={selectedParticipantFromUrl}
          activeTab={participantTabFromUrl}
          onTabChange={onParticipantTabChange}
          onClearParticipantId={() => onClearParticipantId?.()}
        />
      </div>
    )
  }

  return (
    <div
      className={[
        'program-status-participating participating-participants-section',
        viewMode === 'calendar' ? 'general-program-detail--calendar-view' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <FilterTableLayout
        className="participating-institutions-section__filter-layout"
        bordered={false}
        filterResponsiveWrap={false}
        contentVariant={viewMode === 'calendar' ? 'calendar' : 'table'}
        fields={participatingIndividualParticipantsFilterFields}
        filters={filterTableValues}
        onFilterChange={handleFilterChange}
        onSearch={handleFilterSearch}
        title="교육 참여자 목록"
        description={`${filteredParticipants.length}건`}
        actions={
          <>
            <CmsButton
              variant="secondary"
              size="large"
              width={CMS_CERTIFICATE_ISSUE_BUTTON_WIDTH}
              icon={<DownloadOutlined />}
              disabled={certificateExportActive}
              onClick={handleCertificateIssueClick}
            >
              수료증/참여인증서 발급
            </CmsButton>
            {viewMode === 'list' ? (
              <CmsButton
                variant="secondary"
                size="large"
                style={{ minWidth: 180 }}
                icon={<CalendarOutlined />}
                onClick={() => setViewMode('calendar')}
              >
                캘린더 뷰로 보기
              </CmsButton>
            ) : (
              <CmsButton
                variant="secondary"
                size="large"
                style={{ minWidth: 180 }}
                icon={<UnorderedListOutlined />}
                onClick={() => setViewMode('list')}
              >
                리스트 뷰로 보기
              </CmsButton>
            )}
          </>
        }
        excelExport={{
          columns: excelColumns,
          data: filteredParticipants,
        }}
      >
        {viewMode === 'list' ? (
          <div ref={tableWrapRef} className="participating-institutions-section__table-wrap">
            <Table<ParticipatingIndividualParticipantRow>
              className="cms-data-table participating-institutions-section__table participating-institutions-section__table--clickable"
              rowKey="id"
              size="middle"
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: tableScrollX }}
              columns={columns}
              dataSource={filteredParticipants}
              rowSelection={{
                selectedRowKeys,
                onChange: keys => setSelectedRowKeys(keys as string[]),
              }}
              onRow={record => ({
                onClick: e => {
                  const target = e.target as HTMLElement
                  if (
                    target.closest('.ant-table-selection-column') ||
                    target.closest('.ant-checkbox-wrapper')
                  ) {
                    return
                  }
                  onParticipantRowClick?.(record)
                },
                style: { cursor: onParticipantRowClick ? 'pointer' : undefined },
              })}
            />
          </div>
        ) : (
          <div className="participating-institutions-section__calendar-wrap">
            <ParticipatingParticipantsCalendarView
              participants={filteredParticipants}
              selectedRowKeys={selectedRowKeys}
              onSelectionChange={keys => setSelectedRowKeys(keys.map(String))}
              onParticipantClick={participant => onParticipantRowClick?.(participant)}
              calendarGranularity={progressCalendarGranularity}
              onCalendarGranularityChange={setProgressCalendarGranularity}
            />
          </div>
        )}
      </FilterTableLayout>

      {viewMode === 'calendar' ? (
        <div className="participating-institutions-section__page-bottom-spacer" aria-hidden />
      ) : null}

      <CertificateBulkIssueReasonModal
        open={certificateIssueModalOpen}
        onCancel={handleCertificateIssueModalCancel}
        applicationIds={
          selectedRowKeys.length === 1 ? [String(selectedRowKeys[0])] : []
        }
        onIssue={handleCertificateIssueConfirm}
      />
      <FormCertificatePdfExportOverlay visible={certificateExportActive} />
      {certificateExportContext != null ? (
        <StudentCertificatePdfExportHost
          key={`${certificateExportContext.student.id}-${certificateExportContext.certificateKind}-${certificateExportContext.issuanceReasonLabel}`}
          context={certificateExportContext}
          onComplete={handleCertificateExportComplete}
        />
      ) : null}
    </div>
  )
}
