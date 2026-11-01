import { useCallback, useMemo, useState } from 'react'
import { Spin } from 'antd'
import { useRegionAssignment } from './use-region-assignment'
import { CmsButton } from '@/shared/ui'
import { useUjatCanWrite } from '@/features/program/ujat/lib/use-can-write'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { getDefaultUjatEducationRegionKey } from '@/features/program/ujat/lib/ujat-education-regions'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import { UjatInstitutionApplicationRegionTabs } from '../../application-institution/list/region-tabs'
import { UjatAssignmentAssignModal } from '../shared/assign-modal'
import type { EducationProgressHalfKey } from '../tabs'
import { RegionAssignmentTable } from './assignment-table'
import { RegionAssignmentDownloadModal } from './assignment-download-modal'
import {
  getRegionAttendanceManagerScheduleItemsFromData,
  type RegionAttendanceManagerAssignments,
} from './attendance-manager'
import { RegionAttendanceManagerModal } from './attendance-manager-modal'
import {
  AUTO_ASSIGN_RERUN_CONFIRM_MESSAGE,
  hasExistingRegionAssignments,
} from './auto-assign-result'
import { RegionBlockedDateModal } from './blocked-date-modal'
import {
  getRegionBlockedDateSubstituteVolunteerOptionsFromData,
  getRegionBlockedDateVolunteerOptions,
  getRegionDirectAssignClassOptionsFromData,
  getRegionEducationDateOptions,
} from './region-assignment-options'
import { useDirectAssignCandidates } from './use-direct-assign-candidates'
import { RegionAutoAssignResultBanner } from './auto-assign-result-banner'
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import './section.css'

export function UjatEducationProgressRegionAssignmentSection({
  programId,
  half,
}: {
  programId: string
  half: EducationProgressHalfKey
}) {
  const canWrite = useUjatCanWrite()
  const [activeRegion, setActiveRegion] = useState<UjatInstitutionApplicationRegionKey>(
    getDefaultUjatEducationRegionKey
  )
  const [directAssignModalOpen, setDirectAssignModalOpen] = useState(false)
  const [blockedDateModalOpen, setBlockedDateModalOpen] = useState(false)
  const [attendanceManagerModalOpen, setAttendanceManagerModalOpen] = useState(false)
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [autoAssignConfirmOpen, setAutoAssignConfirmOpen] = useState(false)

  const {
    tableData,
    tableVersion,
    isLoading,
    isError,
    isRemote,
    autoAssignResultSummary,
    dismissAutoAssignResult,
    runAutoAssign,
    confirmDirectAssign,
    confirmBlockedDate,
    saveAttendanceManagers,
    isMutating,
  } = useRegionAssignment(programId, half, activeRegion)

  const [directAssignClassSlotId, setDirectAssignClassSlotId] = useState<string | undefined>()

  const directAssignClassOptions = useMemo(
    () => getRegionDirectAssignClassOptionsFromData(tableData),
    [tableData]
  )

  const directAssignCandidates = useDirectAssignCandidates({
    programId,
    classSlotId: directAssignClassSlotId,
    enabled: directAssignModalOpen && isRemote,
    tableData,
  })

  const blockedDateVolunteerOptions = useMemo(
    () => getRegionBlockedDateVolunteerOptions(activeRegion),
    [activeRegion, tableVersion]
  )

  const educationDateOptions = useMemo(
    () => getRegionEducationDateOptions(activeRegion),
    [activeRegion, tableVersion]
  )

  const getBlockedDateSubstituteVolunteerOptions = useCallback(
    (volunteerId: string, blockedDateLabels: string[]) =>
      getRegionBlockedDateSubstituteVolunteerOptionsFromData(
        tableData,
        volunteerId,
        blockedDateLabels
      ),
    [tableData]
  )

  const attendanceManagerScheduleItems = useMemo(
    () => getRegionAttendanceManagerScheduleItemsFromData(tableData),
    [tableData]
  )

  /** 교육일 컬럼이 없으면 배정표를 그리지 않는다 (봉사자만 오고 columns=[]인 BE 반기 필터 응답 포함) */
  const hasScheduleColumns = tableData.columns.length > 0
  const actionsDisabled = isLoading || isError || isMutating || !hasScheduleColumns

  const handleOpenDirectAssignModal = useCallback(() => {
    setDirectAssignModalOpen(true)
  }, [])

  const handleOpenDownloadModal = useCallback(() => {
    setDownloadModalOpen(true)
  }, [])

  const handleCloseDownloadModal = useCallback(() => {
    setDownloadModalOpen(false)
  }, [])

  const handleCloseDirectAssignModal = useCallback(() => {
    setDirectAssignModalOpen(false)
  }, [])

  const handleConfirmDirectAssign = useCallback(
    (payload: { classSlotId: string; volunteerId: string }) => {
      confirmDirectAssign(payload)
      setDirectAssignModalOpen(false)
    },
    [confirmDirectAssign]
  )

  const handleOpenBlockedDateModal = useCallback(() => {
    setBlockedDateModalOpen(true)
  }, [])

  const handleCloseBlockedDateModal = useCallback(() => {
    setBlockedDateModalOpen(false)
  }, [])

  const handleConfirmBlockedDate = useCallback(
    (payload: {
      volunteerId: string
      blockedDateLabels: string[]
      substituteVolunteerId: string
    }) => {
      confirmBlockedDate(payload)
      setBlockedDateModalOpen(false)
    },
    [confirmBlockedDate]
  )

  const handleAutoAssign = useCallback(() => {
    if (hasExistingRegionAssignments(tableData)) {
      setAutoAssignConfirmOpen(true)
      return
    }
    runAutoAssign()
  }, [runAutoAssign, tableData])

  const handleConfirmAutoAssign = useCallback(() => {
    setAutoAssignConfirmOpen(false)
    runAutoAssign()
  }, [runAutoAssign])

  const handleCancelAutoAssign = useCallback(() => {
    setAutoAssignConfirmOpen(false)
  }, [])

  const handleOpenAttendanceManagerModal = useCallback(() => {
    setAttendanceManagerModalOpen(true)
  }, [])

  const handleCloseAttendanceManagerModal = useCallback(() => {
    setAttendanceManagerModalOpen(false)
  }, [])

  const handleSaveAttendanceManager = useCallback(
    (assignments: RegionAttendanceManagerAssignments) => {
      saveAttendanceManagers(assignments)
      setAttendanceManagerModalOpen(false)
    },
    [saveAttendanceManagers]
  )

  return (
    <div className="ujat-education-progress-region-assignment">
      <UjatInstitutionApplicationRegionTabs
        activeRegion={activeRegion}
        onChange={setActiveRegion}
      />

      <div className="table-header-actions">
        <div className="table-header-title--wrapper">
          <div className="table-title">{tableData.regionLabel} 지역 교육 배정</div>
          <span className="table-description">
            총 {hasScheduleColumns ? tableData.volunteerCount : 0}명
          </span>
        </div>

        <div className="table-header-actions--wrapper">
          {canWrite ? (
          <>
          <CmsButton
            type="button"
            variant="secondary"
            size="h40"
            icon={<ButtonDownloadIcon />}
            disabled={isLoading || isError || !hasScheduleColumns}
            onClick={handleOpenDownloadModal} >
            배정표 다운로드
          </CmsButton>
          <CmsButton
            type="button"
            variant="delete"
            size="h40"
            disabled={actionsDisabled}
            onClick={handleOpenBlockedDateModal} >
            참여 불가일 설정
          </CmsButton>
          <CmsButton
            type="button"
            variant="secondary"
            size="h40"
            disabled={actionsDisabled}
            onClick={handleOpenAttendanceManagerModal} >
            출결 담당자 설정
          </CmsButton>
          <CmsButton
            type="button"
            variant="primary"
            size="h40"
            disabled={actionsDisabled}
            onClick={handleOpenDirectAssignModal} >
            교육일 직접 배정
          </CmsButton>
          <CmsButton
            type="button"
            variant="primary"
            size="h40"
            disabled={actionsDisabled}
            onClick={handleAutoAssign} >
            교육일 자동 배정
          </CmsButton>
          </>
          ) : null}
        </div>
      </div>

      {autoAssignResultSummary ? (
        <RegionAutoAssignResultBanner
          summary={autoAssignResultSummary}
          onClose={dismissAutoAssignResult}
        />
      ) : null}

      {isLoading ? (
        <div className="ujat-education-progress-region-assignment__state">
          <Spin size="large" />
        </div>
      ) : isError ? (
        <div className="ujat-education-progress-region-assignment__state" role="alert">
          지역별 교육 배정 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      ) : !hasScheduleColumns ? (
        <div className="ujat-education-progress-region-assignment__state">
          {isRemote
            ? tableData.rows.length > 0
              ? '해당 지역·반기에 표시할 교육 일정이 없습니다. 교육일이 임시 배정·확정되었는지, 선택한 상·하반기와 일정 학기가 일치하는지 확인해 주세요.'
              : '해당 지역에 표시할 교육 일정·봉사자가 없습니다.'
            : '원격 API를 사용할 수 없어 배정표를 표시하지 않습니다.'}
        </div>
      ) : (
        <RegionAssignmentTable data={tableData} />
      )}

      <RegionAssignmentDownloadModal
        open={downloadModalOpen}
        data={tableData}
        onCancel={handleCloseDownloadModal}
      />

      <UjatAssignmentAssignModal
        variant="region_direct"
        open={directAssignModalOpen}
        classOptions={directAssignClassOptions}
        volunteerOptions={directAssignCandidates.volunteerOptions}
        volunteerOptionsLoading={directAssignCandidates.loading}
        volunteerOptionsError={directAssignCandidates.errorMessage}
        existingPrimaryVolunteerName={directAssignCandidates.existingPrimaryVolunteerName}
        onClassSlotChange={setDirectAssignClassSlotId}
        onCancel={handleCloseDirectAssignModal}
        onConfirm={handleConfirmDirectAssign}
      />

      <RegionBlockedDateModal
        open={blockedDateModalOpen}
        volunteerOptions={blockedDateVolunteerOptions}
        educationDateOptions={educationDateOptions}
        getSubstituteVolunteerOptions={getBlockedDateSubstituteVolunteerOptions}
        onCancel={handleCloseBlockedDateModal}
        onConfirm={handleConfirmBlockedDate}
      />

      <ConfirmModal
        open={autoAssignConfirmOpen}
        title="교육일 자동 배정"
        content={AUTO_ASSIGN_RERUN_CONFIRM_MESSAGE}
        confirmText="자동 배정"
        onConfirm={handleConfirmAutoAssign}
        onCancel={handleCancelAutoAssign}
      />

      <RegionAttendanceManagerModal
        open={attendanceManagerModalOpen}
        scheduleItems={attendanceManagerScheduleItems}
        onCancel={handleCloseAttendanceManagerModal}
        onSave={handleSaveAttendanceManager}
      />
    </div>
  )
}
