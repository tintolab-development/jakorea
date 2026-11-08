import { useCallback, useEffect, useMemo, useState } from 'react'
import { Spin } from 'antd'
import { useRegionAssignment } from './use-region-assignment'
import { FilterTableToolbarButton } from '@/shared/ui'
import { useUjatCanWrite } from '@/features/program/ujat/lib/use-can-write'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { getDefaultUjatEducationRegionKey } from '@/features/program/ujat/lib/ujat-education-regions'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
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
  getRegionBlockedDateVolunteerOptionsFromData,
  regionUnavailabilityRequiresReplacement,
  getRegionAssignmentDisplayedVolunteerCount,
  getRegionDirectAssignClassOptionsFromData,
  getRegionEducationDateOptionsFromData,
} from './region-assignment-options'
import { useDirectAssignCandidates } from './use-direct-assign-candidates'
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
  const { regions: educationRegions } = useUjatEducationRegions()
  const [activeRegion, setActiveRegion] = useState<UjatInstitutionApplicationRegionKey>(
    getDefaultUjatEducationRegionKey
  )

  useEffect(() => {
    if (educationRegions.length === 0) return
    if (educationRegions.some(region => region.key === activeRegion)) return
    const next = educationRegions[0]?.key?.trim()
    if (next) setActiveRegion(next)
  }, [activeRegion, educationRegions])
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
    refetchMatrix,
    runAutoAssign,
    confirmDirectAssign,
    confirmBlockedDate,
    saveAttendanceManagers,
    isSavingAttendanceManagers,
    isMutating,
  } = useRegionAssignment(programId, half, activeRegion)

  const [directAssignClassSlotId, setDirectAssignClassSlotId] = useState<string | undefined>()

  const directAssignClassOptions = getRegionDirectAssignClassOptionsFromData(tableData)

  const directAssignCandidates = useDirectAssignCandidates({
    programId,
    classSlotId: directAssignClassSlotId,
    enabled: directAssignModalOpen && isRemote,
    tableData,
  })

  const blockedDateVolunteerOptions = useMemo(
    () => getRegionBlockedDateVolunteerOptionsFromData(tableData),
    [tableData, tableVersion]
  )

  const educationDateOptions = useMemo(
    () => getRegionEducationDateOptionsFromData(tableData),
    [tableData, tableVersion]
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

  const getBlockedDateRequiresReplacement = useCallback(
    (volunteerId: string, blockedDateLabels: string[]) =>
      regionUnavailabilityRequiresReplacement(tableData, volunteerId, blockedDateLabels),
    [tableData]
  )

  const attendanceManagerScheduleItems = useMemo(
    () => getRegionAttendanceManagerScheduleItemsFromData(tableData),
    [tableData]
  )

  /** 교육일 열이 없으면 배정 액션만 막는다. 봉사자 행·총 교육일 0은 그대로 표시한다. */
  const hasScheduleColumns = tableData.columns.length > 0
  const actionsDisabled = isLoading || isError || isMutating || !hasScheduleColumns

  const handleOpenDirectAssignModal = useCallback(() => {
    void refetchMatrix()
    setDirectAssignModalOpen(true)
  }, [refetchMatrix])

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
      substituteVolunteerId?: string
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
    async (assignments: RegionAttendanceManagerAssignments) => {
      const saved = await saveAttendanceManagers(assignments)
      if (saved) setAttendanceManagerModalOpen(false)
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
            총 {getRegionAssignmentDisplayedVolunteerCount(tableData)}명
          </span>
        </div>

        <div className="table-header-actions--wrapper">
          {canWrite ? (
            <>
              <FilterTableToolbarButton
                type="button"
                variant="secondary"
                icon={<ButtonDownloadIcon />}
                disabled={isLoading || isError || !hasScheduleColumns}
                onClick={handleOpenDownloadModal}
              >
                배정표 다운로드
              </FilterTableToolbarButton>
              <FilterTableToolbarButton
                type="button"
                variant="delete"
                disabled={actionsDisabled}
                onClick={handleOpenBlockedDateModal}
              >
                참여 불가일 설정
              </FilterTableToolbarButton>
              <FilterTableToolbarButton
                type="button"
                variant="secondary"
                disabled={actionsDisabled}
                onClick={handleOpenAttendanceManagerModal}
              >
                출결 담당자 설정
              </FilterTableToolbarButton>
              <FilterTableToolbarButton
                type="button"
                variant="primary"
                disabled={actionsDisabled}
                onClick={handleOpenDirectAssignModal}
              >
                교육일 직접 배정
              </FilterTableToolbarButton>
              <FilterTableToolbarButton
                type="button"
                variant="primary"
                disabled={actionsDisabled}
                onClick={handleAutoAssign}
              >
                교육일 자동 배정
              </FilterTableToolbarButton>
            </>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <div className="ujat-education-progress-region-assignment__state">
          <Spin size="large" />
        </div>
      ) : isError ? (
        <div className="ujat-education-progress-region-assignment__state" role="alert">
          지역별 교육 배정 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      ) : !isRemote ? (
        <div className="ujat-education-progress-region-assignment__state">
          원격 API를 사용할 수 없어 배정표를 표시하지 않습니다.
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
        onClassSlotChange={setDirectAssignClassSlotId}
        onCancel={handleCloseDirectAssignModal}
        onConfirm={handleConfirmDirectAssign}
      />

      <RegionBlockedDateModal
        open={blockedDateModalOpen}
        volunteerOptions={blockedDateVolunteerOptions}
        educationDateOptions={educationDateOptions}
        getRequiresReplacement={getBlockedDateRequiresReplacement}
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
        saving={isSavingAttendanceManagers}
        onCancel={handleCloseAttendanceManagerModal}
        onSave={handleSaveAttendanceManager}
      />
    </div>
  )
}
