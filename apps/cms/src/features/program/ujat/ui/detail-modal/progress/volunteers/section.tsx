import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  parseUjatVolAddMemberIdParam,
  UJAT_EDU_VOL_ID_PARAM,
  UJAT_VOL_ADD_MEMBER_ID_PARAM,
} from '@/features/program/ujat/lib/ujat-program-detail-url'
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
import { useContainerFitTableScrollX } from '@/shared/lib/resolve-table-min-scroll-x'
import type { ParticipatingVolunteerDetailRow } from '@/features/program/general/lib/participating-volunteer-detail'
import { ParticipatingVolunteerActivityCertificatePreviewModal } from '@/features/program/general/ui/detail-modal/program-status/participating-volunteer-activity-certificate-preview-modal'
import { CertificateBulkIssueReasonModal } from '@/features/user/detail/ui/modal/certificate-bulk-issue-reason-modal'
import type { CertificateIssueReasonValue } from '@/features/user/detail/ui/modal/certificate-bulk-issue-reason-modal'
import { ACTIVITY_CERTIFICATE_DOCUMENT_TITLE } from '@/features/program/general/lib/build-activity-certificate-issuance-preview'
import type { StudentCertificateDownloadContext } from '@/features/program/general/lib/build-student-certificate-issuance'
import { FormCertificatePdfExportOverlay } from '@/pages/templates/form-certificate-pdf-export-overlay'
import { StudentCertificatePdfExportHost } from '@/features/program/general/ui/detail-modal/program-status/student-certificate-pdf-export-host'
import type { EducationProgressHalfKey } from '../tabs'
import { UjatAddVolunteerModal } from './add-volunteer-modal'
import { UjatVolunteerAddRegistrationModal } from './add-registration-modal'
import {
  isUjatProgressVolunteerMissingId1365,
  UJAT_PROGRESS_VOLUNTEER_1365_REQUIRED_MESSAGE,
} from './ujat-volunteer-participant-register-request'
import { unmaskMemberForCertificateIssue } from '@/features/program/shared/lib/unmask-for-certificate-issue'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import {
  buildActivityCertificateVolunteerFromUjatDetail,
  buildStudentCertificateContextFromUjatVolunteer,
  hasUjatCertificateAssignment,
  UJAT_CERTIFICATE_NO_ASSIGNMENT_ALERT,
} from './activity-certificate'
import { loadVolunteerAssignmentProgress } from './detail/assignment-progress-load'
import { toUjatRecruitHalfApi } from '@/features/program/ujat/api/ujat-recruit-half'
import { toUjatEducationRegionCode } from '@/features/program/ujat/api/ujat-education-region-code'
import type { UjatVolunteerAssignmentProgressBundle } from './detail/assignment-types'
import { buildUjatEducationProgressVolunteerFilterFields } from './filter-fields'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
import { useUjatEducationProgressVolunteerDetail } from './detail/use-detail'
import { useUjatEducationProgressVolunteers } from './use-list'
import type { UjatEducationProgressVolunteerRow } from './types'
import { Volunteer1365PreviewModal } from './volunteer-1365-preview-modal'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import './section.css'
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'

export function UjatEducationProgressVolunteersSection({
  program,
  half,
  onOpenDetail,
}: {
  program: Program
  half: EducationProgressHalfKey
  /** 목록 행 클릭 → 봉사자 상세 */
  onOpenDetail?: (volunteerId: string) => void
}) {
  const { showAlert } = useCmsAlert()
  const [searchParams, setSearchParams] = useSearchParams()
  const eduVolDetailId = searchParams.get(UJAT_EDU_VOL_ID_PARAM)
  const [addVolunteerModalOpen, setAddVolunteerModalOpen] = useState(false)
  const [addRegistrationMemberId, setAddRegistrationMemberId] = useState<string | null>(null)
  const [activityCertificateVolunteer, setActivityCertificateVolunteer] =
    useState<ParticipatingVolunteerDetailRow | null>(null)
  /** 활동인증서 발급 사유 모달(CMS-FUNC-0161·0265) → 사유 선택 후 미리보기 */
  const [activityCertReasonOpen, setActivityCertReasonOpen] = useState(false)
  const [activityCertReasonLabel, setActivityCertReasonLabel] = useState<string | undefined>()
  const [activityCertPreviewOpen, setActivityCertPreviewOpen] = useState(false)
  const [studentCertificateIssueModalOpen, setStudentCertificateIssueModalOpen] = useState(false)
  const [studentCertificateExportContext, setStudentCertificateExportContext] =
    useState<StudentCertificateDownloadContext | null>(null)
  const [studentCertificateExportActive, setStudentCertificateExportActive] = useState(false)
  const [certificateProgressLoading, setCertificateProgressLoading] = useState(false)
  const [volunteer1365PreviewOpen, setVolunteer1365PreviewOpen] = useState(false)
  const { regions: educationRegions } = useUjatEducationRegions()
  const filterFields = useMemo(
    () => buildUjatEducationProgressVolunteerFilterFields(educationRegions),
    [educationRegions]
  )

  const {
    pendingFilters,
    appliedFilters,
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
    refreshVolunteerList,
  } = useUjatEducationProgressVolunteers(program.id, half)

  const selectedRegionKey =
    appliedFilters.regionKey.trim() || pendingFilters.regionKey.trim()
  const registerEducationRegionCode = selectedRegionKey
    ? toUjatEducationRegionCode(selectedRegionKey)
    : undefined

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
    setAddRegistrationMemberId(null)
  }, [half, resetHalfState])

  /** 레거시 딥링크 `volAddMemberId` → 모달로 전환 후 URL에서 제거 */
  useEffect(() => {
    const fromUrl = parseUjatVolAddMemberIdParam(searchParams.get(UJAT_VOL_ADD_MEMBER_ID_PARAM))
    if (fromUrl == null) return
    setAddRegistrationMemberId(fromUrl)
    const next = new URLSearchParams(searchParams)
    next.delete(UJAT_VOL_ADD_MEMBER_ID_PARAM)
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (!eduVolDetailId) {
      refreshVolunteerList()
    }
  }, [eduVolDetailId, refreshVolunteerList])

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
    showAlert(NO_SELECTION_ALERT)
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

  const loadSelectedVolunteerProgressBundle = useCallback(async (): Promise<
    UjatVolunteerAssignmentProgressBundle | null
  > => {
    const detail = selectedVolunteerDetail
    if (!detail) {
      showAlert({
        title: '안내',
        content: '선택한 봉사자 정보를 확인할 수 없습니다.',
      })
      return null
    }
    const memberId = String(detail.applicant.memberId ?? detail.row.memberId ?? '').trim()
    if (!memberId) {
      showAlert({
        title: '안내',
        content: '봉사자 회원 정보를 확인할 수 없어 인증서를 발급할 수 없습니다.',
      })
      return null
    }
    const regionKey = detail.row.regionKey?.trim() ?? ''
    setCertificateProgressLoading(true)
    try {
      const progress = await loadVolunteerAssignmentProgress({
        programId: program.id,
        memberId,
        semesterType: toUjatRecruitHalfApi(half),
        educationRegionCode: regionKey ? toUjatEducationRegionCode(regionKey) : undefined,
      })
      if (progress.participantId == null) {
        showAlert({
          title: '안내',
          content: '봉사자 참가자를 확인할 수 없어 인증서를 발급할 수 없습니다.',
        })
        return null
      }
      if (!hasUjatCertificateAssignment(progress.bundle)) {
        showAlert({ title: '안내', content: UJAT_CERTIFICATE_NO_ASSIGNMENT_ALERT })
        return null
      }
      return progress.bundle
    } catch {
      showAlert({
        title: '안내',
        content: '배정/출결 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.',
      })
      return null
    } finally {
      setCertificateProgressLoading(false)
    }
  }, [half, program.id, selectedVolunteerDetail, showAlert])

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

    void (async () => {
      const bundle = await loadSelectedVolunteerProgressBundle()
      if (bundle == null) return
      setActivityCertificateVolunteer(
        buildActivityCertificateVolunteerFromUjatDetail(detail, bundle)
      )
      setActivityCertReasonLabel(undefined)
      setActivityCertReasonOpen(true)
    })()
  }, [loadSelectedVolunteerProgressBundle, selectedRowKeys, selectedVolunteerDetail, showAlert])

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
    if (studentCertificateExportActive || certificateProgressLoading) return

    setStudentCertificateIssueModalOpen(true)
  }, [
    certificateProgressLoading,
    selectedRowKeys,
    showAlert,
    studentCertificateExportActive,
  ])

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

      const bundle = await loadSelectedVolunteerProgressBundle()
      if (bundle == null) return

      let context = buildStudentCertificateContextFromUjatVolunteer({
        detail,
        program,
        issuanceReasonLabel: reasonLabel,
        bundle,
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
    [loadSelectedVolunteerProgressBundle, program, selectedVolunteerDetail, showAlert]
  )

  const handleStudentCertificateExportComplete = useCallback(
    (success: boolean) => {
      setStudentCertificateExportContext(null)
      setStudentCertificateExportActive(false)

      if (!success) {
        showAlert({
          title: '안내',
          content: '수료증/참가인증서 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
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
        description={`총 ${tableData.length.toLocaleString()}건`}
        actions={
          <div className="ujat-education-progress-volunteers__actions program-application-list-toolbar">
            <FilterTableToolbarButton
              type="button"
              variant="secondary"
              icon={<ButtonDownloadIcon />}
              disabled={certificateProgressLoading}
              onClick={handleActivityCertificateIssueClick}
            >
              활동인증서 발급
            </FilterTableToolbarButton>
            <FilterTableToolbarButton
              type="button"
              variant="secondary"
              icon={<ButtonDownloadIcon />}
              disabled={studentCertificateExportActive || certificateProgressLoading}
              onClick={handleStudentCertificateIssueClick}
            >
              수료증/참가인증서 발급
            </FilterTableToolbarButton>
            <FilterTableToolbarButton
              type="button"
              variant="secondary"
              icon={<ButtonDownloadIcon />}
              onClick={() => setVolunteer1365PreviewOpen(true)}
            >
              1365 봉사시간 등록 양식
            </FilterTableToolbarButton>
            <FilterTableToolbarButton
                type="button"
                variant="primary"
                onClick={handleRegisterVolunteerClick}
              >
                봉사자 등록
              </FilterTableToolbarButton>
          </div>
        }
        excelExport={
          {
                accessLog: { downloadKind: 'PROGRAM_VOLUNTEER_LIST_EXPORT', containedPiiTypes: ['NAME'] },
                columns,
                data: tableData,
                selectedRowKeys,
              }
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
          const candidate = memberOptions.find(option => option.memberId === memberId)
          if (isUjatProgressVolunteerMissingId1365(candidate?.hasRegisteredId1365)) {
            showAlert({
              title: '안내',
              content: UJAT_PROGRESS_VOLUNTEER_1365_REQUIRED_MESSAGE,
            })
            return
          }
          setAddVolunteerModalOpen(false)
          setAddRegistrationMemberId(memberId)
        }}
      />
      <UjatVolunteerAddRegistrationModal
        open={addRegistrationMemberId != null}
        memberId={addRegistrationMemberId ?? ''}
        program={program}
        volunteerHalf={half}
        educationRegionCode={registerEducationRegionCode}
        onClose={() => setAddRegistrationMemberId(null)}
        onComplete={memberId => addVolunteerFromMember(memberId)}
      />
      {activityCertificateVolunteer ? (
        <ParticipatingVolunteerActivityCertificatePreviewModal
          open={activityCertPreviewOpen}
          onClose={() => {
            setActivityCertPreviewOpen(false)
            setActivityCertificateVolunteer(null)
          }}
          volunteer={activityCertificateVolunteer}
          program={program}
          issuanceReasonLabel={activityCertReasonLabel}
        />
      ) : null}
      <CertificateBulkIssueReasonModal
        open={activityCertReasonOpen}
        onCancel={() => {
          setActivityCertReasonOpen(false)
          setActivityCertificateVolunteer(null)
        }}
        applicationIds={activityCertificateVolunteer ? [activityCertificateVolunteer.id] : []}
        certificateDocumentLabel={ACTIVITY_CERTIFICATE_DOCUMENT_TITLE}
        onIssue={(_reason: CertificateIssueReasonValue, reasonLabel: string) => {
          setActivityCertReasonLabel(reasonLabel)
          setActivityCertPreviewOpen(true)
        }}
      />
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
      />
    </div>
  )
}
