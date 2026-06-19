import { useCallback, useMemo, useState } from 'react'
import { useRegionAssignment } from './use-region-assignment'
import { DownloadOutlined } from '@ant-design/icons'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import { getDefaultUjatEducationRegionKey } from '@/features/program/ujat/lib/ujat-education-regions'
import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import { UjatInstitutionApplicationRegionTabs } from '../../application-institution/list/region-tabs'
import { UjatAssignmentAssignModal } from '../shared/assign-modal'
import type { EducationProgressHalfKey } from '../tabs'
import { RegionAssignmentTable } from './assignment-table'
import { RegionAssignmentDownloadModal } from './assignment-download-modal'
import {
  applyRegionAttendanceManagersFromData,
  getRegionAttendanceManagerScheduleItemsFromData,
  type RegionAttendanceManagerAssignments,
} from './attendance-manager'
import { RegionAttendanceManagerModal } from './attendance-manager-modal'
import { RegionBlockedDateModal } from './blocked-date-modal'
import { setRegionAssignmentTableData } from './region-assignment-store'
import {
  getRegionBlockedDateSubstituteVolunteerOptionsFromData,
  getRegionBlockedDateVolunteerOptions,
  getRegionDirectAssignClassOptions,
  getRegionDirectAssignVolunteerOptions,
  getRegionEducationDateOptions,
} from './mock'
import './section.css'

export function UjatEducationProgressRegionAssignmentSection({
  half: _half,
}: {
  half: EducationProgressHalfKey
}) {
  const { showAlert } = useCmsAlert()
  const [activeRegion, setActiveRegion] = useState<UjatInstitutionApplicationRegionKey>(
    getDefaultUjatEducationRegionKey
  )
  const [directAssignModalOpen, setDirectAssignModalOpen] = useState(false)
  const [blockedDateModalOpen, setBlockedDateModalOpen] = useState(false)
  const [attendanceManagerModalOpen, setAttendanceManagerModalOpen] = useState(false)
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)

  const { tableData, tableVersion, runAutoAssign, bump } = useRegionAssignment(activeRegion)

  const directAssignClassOptions = useMemo(
    () => getRegionDirectAssignClassOptions(activeRegion),
    [activeRegion]
  )

  const getDirectAssignVolunteerOptions = useCallback(
    (classSlotId: string) => getRegionDirectAssignVolunteerOptions(activeRegion, classSlotId),
    [activeRegion]
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

  const handleConfirmDirectAssign = useCallback(() => {
    setDirectAssignModalOpen(false)
    showAlert({
      title: '안내',
      content: '교육일이 직접 배정되었습니다.',
    })
  }, [showAlert])

  const handleOpenBlockedDateModal = useCallback(() => {
    setBlockedDateModalOpen(true)
  }, [])

  const handleCloseBlockedDateModal = useCallback(() => {
    setBlockedDateModalOpen(false)
  }, [])

  const handleConfirmBlockedDate = useCallback(() => {
    setBlockedDateModalOpen(false)
    showAlert({
      title: '안내',
      content: '배정 불가일이 설정되었습니다.',
    })
  }, [showAlert])

  const handleAutoAssign = useCallback(() => {
    runAutoAssign()
    showAlert({
      title: '안내',
      content: '교육일이 자동 배정되었습니다.',
    })
  }, [runAutoAssign, showAlert])

  const handleOpenAttendanceManagerModal = useCallback(() => {
    setAttendanceManagerModalOpen(true)
  }, [])

  const handleCloseAttendanceManagerModal = useCallback(() => {
    setAttendanceManagerModalOpen(false)
  }, [])

  const handleSaveAttendanceManager = useCallback(
    (assignments: RegionAttendanceManagerAssignments) => {
      const next = applyRegionAttendanceManagersFromData(tableData, assignments)
      setRegionAssignmentTableData(activeRegion, next)
      bump()
      setAttendanceManagerModalOpen(false)
      showAlert({
        title: '안내',
        content: '출결 담당자가 저장되었습니다.',
      })
    },
    [activeRegion, bump, showAlert, tableData]
  )

  return (
    <div className="ujat-education-progress-region-assignment">
      <UjatInstitutionApplicationRegionTabs
        activeRegion={activeRegion}
        onChange={setActiveRegion}
      />

      <div className="ujat-education-progress-region-assignment__toolbar">
        <h2 className="ujat-education-progress-region-assignment__title">
          {tableData.regionLabel} 지역 교육 배정
          <span className="ujat-education-progress-region-assignment__count">
            총 {tableData.volunteerCount}명
          </span>
        </h2>

        <div className="ujat-education-progress-region-assignment__actions">
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
            onClick={handleOpenBlockedDateModal}
          >
            배정 불가일 설정
          </CmsButton>
          <CmsButton
            type="button"
            variant="secondary"
            size="large"
            width={140}
            onClick={handleOpenAttendanceManagerModal}
          >
            출결 담당자 설정
          </CmsButton>
          <CmsButton
            type="button"
            variant="primary"
            size="large"
            width={140}
            onClick={handleOpenDirectAssignModal}
          >
            교육일 직접 배정
          </CmsButton>
          <CmsButton
            type="button"
            variant="primary"
            size="large"
            width={140}
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
