import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { UJAT_EDU_VOL_ID_PARAM } from '@/features/program/ujat/lib/ujat-program-detail-url'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  STUDENT_CERTIFICATE_ISSUE_SELECT_ONE_ALERT_MESSAGE,
  STUDENT_CERTIFICATE_ISSUE_SELECT_ONLY_ONE_ALERT_MESSAGE,
} from '@/shared/constants'
import { useCmsAlert,
  FilterTableToolbarButton
} from '@/shared/ui'
import { useUjatCanWrite } from '@/features/program/ujat/lib/use-can-write'
import { useContainerFitTableScrollX } from '@/shared/lib/resolve-table-min-scroll-x'
import type { ParticipatingVolunteerDetailRow } from '@/features/program/general/lib/participating-volunteer-detail'
import { ParticipatingVolunteerActivityCertificatePreviewModal } from '@/features/program/general/ui/detail-modal/program-status/participating-volunteer-activity-certificate-preview-modal'
import { CertificateBulkIssueReasonModal } from '@/features/user/detail/ui/modal/certificate-bulk-issue-reason-modal'
import type { CertificateIssueReasonValue } from '@/features/user/detail/ui/modal/certificate-bulk-issue-reason-modal'
import type { StudentCertificateDownloadContext } from '@/features/program/general/lib/build-student-certificate-issuance'
import { FormCertificatePdfExportOverlay } from '@/pages/templates/form-certificate-pdf-export-overlay'
import { StudentCertificatePdfExportHost } from '@/features/program/general/ui/detail-modal/program-status/student-certificate-pdf-export-host'
import type { EducationProgressHalfKey } from '../tabs'
import { UjatAddVolunteerModal } from './add-volunteer-modal'
import { unmaskMemberForCertificateIssue } from '@/features/program/shared/lib/unmask-for-certificate-issue'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import {
  buildActivityCertificateVolunteerFromUjatDetail,
  buildStudentCertificateContextFromUjatVolunteer,
} from './activity-certificate'
import { buildUjatEducationProgressVolunteerFilterFields } from './filter-fields'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
import { useUjatEducationProgressVolunteerDetail } from './detail/use-detail'
import { useUjatEducationProgressVolunteers } from './use-list'
import type { UjatEducationProgressVolunteerRow } from './types'
import { Volunteer1365PreviewModal } from './volunteer-1365-preview-modal'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
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
  const canWrite = useUjatCanWrite()
  const [searchParams] = useSearchParams()
  const eduVolDetailId = searchParams.get(UJAT_EDU_VOL_ID_PARAM)
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
    loadMemberOptions,
    addVolunteerFromMember,
    syncRowsFromMock,
  } = useUjatEducationProgressVolunteers(program.id, half)

  const selectedVolunteerId = selectedRowKeys.length === 1 ? String(selectedRowKeys[0]) : ''
  const { detail: selectedVolunteerDetail } = useUjatEducationProgressVolunteerDetail({
    programId: program.id,
    half,
    volunteerId: selectedVolunteerId,
  })

  const { tableWrapRef, tableScrollX } = useContainerFitTableScrollX(
    columns as ColumnsType<unknown>,
    { includeSelection: true }
  )

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

  const handleRegisterVolunteerClick = useCallback(() => {
    void loadMemberOptions()
      .then(() => {
        setAddVolunteerModalOpen(true)
      })
      .catch(error => {
        showAlert({
          title: '봉사자 등록 실패',
          content: getMemberApiErrorMessage(
            error,
            '등록 가능한 회원 목록을 불러오지 못했습니다. 다시 시도해 주세요.'
          ),
        })
      })
  }, [loadMemberOptions, showAlert])

  const handleActivityCertificateIssueClick = useCallback(() => {
    if (selectedRowKeys.length !== 1) {
      showAlert({
        title: '안내',
        content: '활동인증서를 발급할 봉사자를 1명 선택해 주세요.',
      })
      return
    }

    const detail = selectedVolunteerDetail

    if (!detail) {
      showAlert({
        title: '안내',
        content: '선택한 봉사자 정보를 확인할 수 없습니다.',
      })
      return
    }

    setActivityCertificateVolunteer(buildActivityCertificateVolunteerFromUjatDetail(detail))
  }, [selectedRowKeys, selectedVolunteerDetail, showAlert])

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
    async (_reason: CertificateIssueReasonValue, reasonLabel: string) => {
      const detail = selectedVolunteerDetail

      if (!detail) {
        showAlert({
          title: '안내',
          content: '선택한 봉사자 정보를 확인할 수 없습니다.',
        })
        return
      }

      let context = buildStudentCertificateContextFromUjatVolunteer({
        detail,
        program,
        issuanceReasonLabel: reasonLabel,
      })
      const memberId = Number(detail.applicant.memberId ?? detail.row.memberId)
      if (Number.isSafeInteger(memberId) && memberId > 0) {
        try {
          const person = await unmaskMemberForCertificateIssue(memberId)
          context = {
            ...context,
            student: {
              ...context.student,
              name: person.name || context.student.name,
              birthDate: person.birthDate || context.student.birthDate,
            },
          }
        } catch (error) {
          showAlert({
            title: '열람 실패',
            content: getGeneralProgramApiErrorMessage(
              error,
              '개인정보 원문 조회에 실패했습니다.'
            ),
          })
          return
        }
      }

      setStudentCertificateExportContext(context)
      setStudentCertificateExportActive(true)
    },
    [program, selectedVolunteerDetail, showAlert]
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
          <div className="ujat-education-progress-volunteers__actions program-application-list-toolbar">
            <FilterTableToolbarButton
              type="button"
              variant="secondary"
              icon={<ButtonDownloadIcon />}
              onClick={handleActivityCertificateIssueClick} >
              활동인증서 발급
            </FilterTableToolbarButton>
            <FilterTableToolbarButton
              type="button"
              variant="secondary"
              icon={<ButtonDownloadIcon />}
              disabled={studentCertificateExportActive}
              onClick={handleStudentCertificateIssueClick} >
              수료증/참여인증서 발급
            </FilterTableToolbarButton>
            <FilterTableToolbarButton
              type="button"
              variant="secondary"
              icon={<ButtonDownloadIcon />}
              onClick={() => setVolunteer1365PreviewOpen(true)} >
              1365 봉사시간 등록 양식
            </FilterTableToolbarButton>
            {canWrite ? (
            <FilterTableToolbarButton
              type="button"
              variant="primary"
              onClick={handleRegisterVolunteerClick} >
              봉사자 등록
            </FilterTableToolbarButton>
            ) : null}
          </div>
        }
        excelExport={
          canWrite
            ? {
                columns,
                data: tableData,
                selectedRowKeys,
              }
            : undefined
        }
      >
        <div ref={tableWrapRef} className="ujat-education-progress-volunteers__table-wrap">
          <CmsDataTable<UjatEducationProgressVolunteerRow>
            rowKey="id"
            className="cms-data-table ujat-education-progress-volunteers__table ujat-education-progress-volunteers__table--clickable"
            columns={columns}
            dataSource={tableData}
            pagination={false}
            tableLayout="fixed"
            scroll={tableScrollX != null ? { x: tableScrollX } : undefined}
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
        programId={program.id}
        selectedMemberId={
          tableData.find(row => String(row.id) === selectedVolunteerId)?.memberId ?? null
        }
        volunteers={tableData.map(row => ({
          id: row.id,
          memberId: row.memberId,
          name: row.volunteerName,
          birthDate: row.birthDate,
          id1365: row.id1365,
          region: row.regionLabel,
        }))}
      />
    </div>
  )
}
