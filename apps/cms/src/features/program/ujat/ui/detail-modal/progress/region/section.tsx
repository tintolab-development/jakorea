import { useCallback, useMemo, useState } from 'react'
import { useRegionAssignment } from './use-region-assignment'
import { DownloadOutlined } from '@ant-design/icons'
import { CmsButton } from '@/shared/ui'
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
import { RegionBlockedDateModal } from './blocked-date-modal'
import {
  getRegionBlockedDateSubstituteVolunteerOptionsFromData,
  getRegionBlockedDateVolunteerOptions,
  getRegionDirectAssignClassOptions,
  getRegionDirectAssignVolunteerOptions,
  getRegionEducationDateOptions,
} from './region-assignment-options'
import './section.css'

export function UjatEducationProgressRegionAssignmentSection({
  programId,
  half,
}: {
  programId: string
  half: EducationProgressHalfKey
}) {
  const [activeRegion, setActiveRegion] = useState<UjatInstitutionApplicationRegionKey>(
    getDefaultUjatEducationRegionKey
  )
  const [directAssignModalOpen, setDirectAssignModalOpen] = useState(false)
  const [blockedDateModalOpen, setBlockedDateModalOpen] = useState(false)
  const [attendanceManagerModalOpen, setAttendanceManagerModalOpen] = useState(false)
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)

  const {
    tableData,
    tableVersion,
    runAutoAssign,
    confirmDirectAssign,
    confirmBlockedDate,
    saveAttendanceManagers,
    isMutating,
  } = useRegionAssignment(programId, half, activeRegion)

  const directAssignClassOptions = useMemo(
    () => getRegionDirectAssignClassOptions(activeRegion),
    [activeRegion, tableVersion]
  )

  const getDirectAssignVolunteerOptions = useCallback(
    (classSlotId: string) => getRegionDirectAssignVolunteerOptions(activeRegion, classSlotId),
    [activeRegion, tableVersion]
  )

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
    runAutoAssign()
  }, [runAutoAssign])

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
          <span className="table-description">총 {tableData.volunteerCount}명</span>
        </div>

        <div className="table-header-actions--wrapper">
          <CmsButton
            type="button"
            variant="secondary"
            size="large"
            width={160}
            icon={<DownloadOutlined />}
            onClick={handleOpenDownloadModal}
          >
            배정표 다운로드
          </CmsButton>
          <CmsButton
            type="button"
            variant="delete"
            size="large"
            width={140}
            disabled={isMutating}
            onClick={handleOpenBlockedDateModal}
          >
            배정 불가일 설정
          </CmsButton>
          <CmsButton
            type="button"
            variant="secondary"
            size="large"
            width={140}
            disabled={isMutating}
            onClick={handleOpenAttendanceManagerModal}
          >
            출결 담당자 설정
          </CmsButton>
          <CmsButton
            type="button"
            variant="primary"
            size="large"
            width={140}
            disabled={isMutating}
            onClick={handleOpenDirectAssignModal}
          >
            교육일 직접 배정
          </CmsButton>
          <CmsButton
            type="button"
            variant="primary"
            size="large"
            width={140}
            disabled={isMutating}
            onClick={handleAutoAssign}
          >
            교육일 자동 배정
          </CmsButton>
        </div>
      </div>

      <RegionAssignmentTable data={tableData} />

      <RegionAssignmentDownloadModal
        open={downloadModalOpen}
        data={tableData}
        onCancel={handleCloseDownloadModal}
      />

      <UjatAssignmentAssignModal
        variant="region_direct"
        open={directAssignModalOpen}
        classOptions={directAssignClassOptions}
        getVolunteerOptions={getDirectAssignVolunteerOptions}
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

      <RegionAttendanceManagerModal
        open={attendanceManagerModalOpen}
        scheduleItems={attendanceManagerScheduleItems}
        onCancel={handleCloseAttendanceManagerModal}
        onSave={handleSaveAttendanceManager}
      />
    </div>
  )
}
