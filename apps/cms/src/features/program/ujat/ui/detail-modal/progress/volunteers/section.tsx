import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { UJAT_EDU_VOL_ID_PARAM } from '@/features/program/ujat/lib/ujat-program-detail-url'
import { Table } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import type { Program } from '@/types/domain'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import {
  STUDENT_CERTIFICATE_ISSUE_SELECT_ONE_ALERT_MESSAGE,
  STUDENT_CERTIFICATE_ISSUE_SELECT_ONLY_ONE_ALERT_MESSAGE,
} from '@/shared/constants'
import { CmsButton, useCmsAlert, CMS_CERTIFICATE_ISSUE_BUTTON_WIDTH } from '@/shared/ui'
import type { ParticipatingVolunteerDetailRow } from '@/features/program/general/lib/participating-volunteer-detail'
import { ParticipatingVolunteerActivityCertificatePreviewModal } from '@/features/program/general/ui/detail-modal/program-status/participating-volunteer-activity-certificate-preview-modal'
import { CertificateBulkIssueReasonModal } from '@/features/user/detail/ui/modal/certificate-bulk-issue-reason-modal'
import type { CertificateIssueReasonValue } from '@/features/user/detail/ui/modal/certificate-bulk-issue-reason-modal'
import type { StudentCertificateDownloadContext } from '@/features/program/general/lib/build-student-certificate-issuance'
import { FormCertificatePdfExportOverlay } from '@/pages/templates/form-certificate-pdf-export-overlay'
import { StudentCertificatePdfExportHost } from '@/features/program/general/ui/detail-modal/program-status/student-certificate-pdf-export-host'
import type { EducationProgressHalfKey } from '../tabs'
import { UjatAddVolunteerModal } from './add-volunteer-modal'
import {
  buildActivityCertificateVolunteerFromUjatDetail,
  buildStudentCertificateContextFromUjatVolunteer,
} from './activity-certificate'
import { buildUjatEducationProgressVolunteerFilterFields } from './filter-fields'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
import { UJAT_EDU_PROGRESS_VOLUNTEERS_TABLE_MIN_SCROLL_X } from './columns'
import { getUjatEducationProgressVolunteerDetail } from './detail/detail-mock'
import { useUjatEducationProgressVolunteers } from './use-list'
import type { UjatEducationProgressVolunteerRow } from './types'
import { Volunteer1365PreviewModal } from './volunteer-1365-preview-modal'
import './section.css'

export function UjatEducationProgressVolunteersSection({
  program,
  half,
  onStartAddRegistration,
  onOpenDetail,
  onBindRegisterVolunteer,
}: {
  program: Program
  half: EducationProgressHalfKey
  /** 회원 선택 후 대리 작성 풀페이지 폼으로 이동 */
  onStartAddRegistration: (memberId: string) => void
  /** 목록 행 클릭 → 봉사자 상세 */
  onOpenDetail?: (volunteerId: string) => void
  /** 풀페이지 폼 완료 시 목록에 반영할 등록 함수 연결 */
  onBindRegisterVolunteer?: (register: (memberId: string) => void) => void
}) {
  const { showAlert } = useCmsAlert()
  const [searchParams] = useSearchParams()
  const eduVolDetailId = searchParams.get(UJAT_EDU_VOL_ID_PARAM)
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const [tableScrollX, setTableScrollX] = useState(UJAT_EDU_PROGRESS_VOLUNTEERS_TABLE_MIN_SCROLL_X)
  const [addVolunteerModalOpen, setAddVolunteerModalOpen] = useState(false)
  const [activityCertificateVolunteer, setActivityCertificateVolunteer] =
    useState<ParticipatingVolunteerDetailRow | null>(null)
  const [studentCertificateIssueModalOpen, setStudentCertificateIssueModalOpen] = useState(false)
  const [studentCertificateExportContext, setStudentCertificateExportContext] =
    useState<StudentCertificateDownloadContext | null>(null)
  const [studentCertificateExportActive, setStudentCertificateExportActive] = useState(false)
  const [volunteer1365PreviewOpen, setVolunteer1365PreviewOpen] = useState(false)
  const { regions: educationRegions } = useUjatEducationRegions()
  const filterFields = useMemo(
    () => buildUjatEducationProgressVolunteerFilterFields(),
    [educationRegions]
  )

  const {
    pendingFilters,
    handleFilterChange,
    handleSearch,
    tableData,
    columns,
    selectedRowKeys,
    setSelectedRowKeys,
    resetHalfState,
    memberOptions,
    addVolunteerFromMember,
    syncRowsFromMock,
  } = useUjatEducationProgressVolunteers(half)

  useEffect(() => {
    resetHalfState()
    setAddVolunteerModalOpen(false)
  }, [half, resetHalfState])

  useEffect(() => {
    if (!eduVolDetailId) {
      syncRowsFromMock()
    }
  }, [eduVolDetailId, syncRowsFromMock])

  useEffect(() => {
    onBindRegisterVolunteer?.(addVolunteerFromMember)
  }, [addVolunteerFromMember, onBindRegisterVolunteer])

  useLayoutEffect(() => {
    const el = tableWrapRef.current
    if (!el) return
    const minW = UJAT_EDU_PROGRESS_VOLUNTEERS_TABLE_MIN_SCROLL_X
    const update = () => {
      const w = el.getBoundingClientRect().width
      setTableScrollX(Math.max(minW, Math.floor(w)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const handleRowClick = useCallback(
    (record: UjatEducationProgressVolunteerRow, event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('.ant-checkbox-wrapper, .ant-checkbox, input[type="checkbox"]')) {
        return
      }
      onOpenDetail?.(record.id)
    },
    [onOpenDetail]
  )

  const showNoMemberSelectedAlert = useCallback(() => {
    showAlert({
      title: '안내',
      content: '추가 등록할 회원을 선택해 주세요.',
    })
  }, [showAlert])

  const handleActivityCertificateIssueClick = useCallback(() => {
    if (selectedRowKeys.length !== 1) {
      showAlert({
        title: '안내',
        content: '활동인증서를 발급할 봉사자를 1명 선택해 주세요.',
      })
      return
    }

    const selectedVolunteerId = String(selectedRowKeys[0])
    const detail = getUjatEducationProgressVolunteerDetail(program.id, half, selectedVolunteerId)

    if (!detail) {
      showAlert({
        title: '안내',
        content: '선택한 봉사자 정보를 확인할 수 없습니다.',
      })
      return
    }

    setActivityCertificateVolunteer(buildActivityCertificateVolunteerFromUjatDetail(detail))
  }, [half, program.id, selectedRowKeys, showAlert])

  const handleStudentCertificateIssueClick = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      showAlert({ title: '안내', content: STUDENT_CERTIFICATE_ISSUE_SELECT_ONE_ALERT_MESSAGE })
      return
    }
    if (selectedRowKeys.length > 1) {
      showAlert({
        title: '안내',
        content: STUDENT_CERTIFICATE_ISSUE_SELECT_ONLY_ONE_ALERT_MESSAGE,
      })
      return
    }
    if (studentCertificateExportActive) return

    setStudentCertificateIssueModalOpen(true)
  }, [selectedRowKeys, showAlert, studentCertificateExportActive])

  const handleStudentCertificateIssueConfirm = useCallback(
    (_reason: CertificateIssueReasonValue, reasonLabel: string) => {
      const selectedVolunteerId = String(selectedRowKeys[0])
      const detail = getUjatEducationProgressVolunteerDetail(program.id, half, selectedVolunteerId)

      if (!detail) {
        showAlert({
          title: '안내',
          content: '선택한 봉사자 정보를 확인할 수 없습니다.',
        })
        return
      }

      setStudentCertificateExportContext(
        buildStudentCertificateContextFromUjatVolunteer({
          detail,
          program,
          issuanceReasonLabel: reasonLabel,
        })
      )
      setStudentCertificateExportActive(true)
    },
    [half, program, selectedRowKeys, showAlert]
  )

  const handleStudentCertificateExportComplete = useCallback(
    (success: boolean) => {
      setStudentCertificateExportContext(null)
      setStudentCertificateExportActive(false)

      if (!success) {
        showAlert({
          title: '안내',
          content: '수료증/참여인증서 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        })
      }
    },
    [showAlert]
  )

  return (
    <div className="ujat-education-progress-volunteers">
      <FilterTableLayout
        className="ujat-education-progress-volunteers__filter-layout"
        bordered={false}
        fields={filterFields}
        key={educationRegions.map(region => region.key).join(',')}
        filters={pendingFilters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        title="참여 봉사자 목록"
        description={`${tableData.length}건`}
        actions={
          <div className="ujat-education-progress-volunteers__actions">
            <CmsButton
              type="button"
              variant="secondary"
              size="large"
              width={180}
              icon={<DownloadOutlined />}
              onClick={handleActivityCertificateIssueClick}
            >
              활동인증서 발급
            </CmsButton>
            <CmsButton
              type="button"
              variant="secondary"
              size="large"
              width={CMS_CERTIFICATE_ISSUE_BUTTON_WIDTH}
              icon={<DownloadOutlined />}
              disabled={studentCertificateExportActive}
              onClick={handleStudentCertificateIssueClick}
            >
              수료증/참여인증서 발급
            </CmsButton>
            <CmsButton
              type="button"
              variant="secondary"
              size="large"
              width={220}
              icon={<DownloadOutlined />}
              onClick={() => setVolunteer1365PreviewOpen(true)}
            >
              1365 봉사시간 등록 양식
            </CmsButton>
            <CmsButton
              type="button"
              variant="primary"
              size="large"
              width={140}
              onClick={() => setAddVolunteerModalOpen(true)}
            >
              봉사자 등록
            </CmsButton>
          </div>
        }
        excelExport={{
          columns,
          data: tableData,
        }}
      >
        <div ref={tableWrapRef} className="ujat-education-progress-volunteers__table-wrap">
          <Table<UjatEducationProgressVolunteerRow>
            rowKey="id"
            className="cms-data-table ujat-education-progress-volunteers__table ujat-education-progress-volunteers__table--clickable"
            columns={columns}
            dataSource={tableData}
            pagination={false}
            tableLayout="fixed"
            scroll={{ x: tableScrollX }}
            onRow={record => ({
              onClick: event => handleRowClick(record, event),
            })}
            rowSelection={{
              selectedRowKeys,
              onChange: keys => setSelectedRowKeys(keys),
            }}
          />
        </div>
      </FilterTableLayout>

      <UjatAddVolunteerModal
        open={addVolunteerModalOpen}
        onCancel={() => setAddVolunteerModalOpen(false)}
        memberOptions={memberOptions}
        onNoMemberSelected={showNoMemberSelectedAlert}
        onAdd={memberId => {
          setAddVolunteerModalOpen(false)
          onStartAddRegistration(memberId)
        }}
      />
      {activityCertificateVolunteer ? (
        <ParticipatingVolunteerActivityCertificatePreviewModal
          open
          onClose={() => setActivityCertificateVolunteer(null)}
          volunteer={activityCertificateVolunteer}
          program={program}
        />
      ) : null}
      <CertificateBulkIssueReasonModal
        open={studentCertificateIssueModalOpen}
        onCancel={() => setStudentCertificateIssueModalOpen(false)}
        applicationIds={selectedRowKeys.length === 1 ? [String(selectedRowKeys[0])] : []}
        onIssue={handleStudentCertificateIssueConfirm}
      />
      <FormCertificatePdfExportOverlay visible={studentCertificateExportActive} />
      {studentCertificateExportContext != null ? (
        <StudentCertificatePdfExportHost
          key={`${studentCertificateExportContext.student.id}-${studentCertificateExportContext.certificateKind}-${studentCertificateExportContext.issuanceReasonLabel}`}
          context={studentCertificateExportContext}
          onComplete={handleStudentCertificateExportComplete}
        />
      ) : null}
      <Volunteer1365PreviewModal
        open={volunteer1365PreviewOpen}
        onCancel={() => setVolunteer1365PreviewOpen(false)}
        half={half}
        volunteerIds={tableData.map(row => row.id)}
      />
    </div>
  )
}
