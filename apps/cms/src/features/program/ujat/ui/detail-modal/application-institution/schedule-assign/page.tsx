import { useCallback, useRef, useState } from 'react'
import { useCmsAlert } from '@/shared/ui'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
import { getDefaultUjatEducationRegionKey } from '@/features/program/ujat/lib/ujat-education-regions'
import type { UjatInstitutionApplicationRegionKey } from '../list/regions'
import {
  UjatInstitutionScheduleAssignSection,
  type UjatScheduleAssignRemoteSave,
} from './section'
import { UjatInstitutionScheduleSheetPreviewModal } from './schedule-sheet-preview-modal'
import { commitUjatScheduleAssignDraft } from './store'
import './page.css'

export function UjatInstitutionScheduleAssignPage({
  programId,
}: {
  programId?: string | null
}) {
  const { showAlert } = useCmsAlert()
  const { regions: regionTabs } = useUjatEducationRegions()
  const [activeRegion, setActiveRegion] = useState<UjatInstitutionApplicationRegionKey>(
    getDefaultUjatEducationRegionKey
  )
  const [scheduleSheetOpen, setScheduleSheetOpen] = useState(false)
  const [scheduleSheetRefreshKey, setScheduleSheetRefreshKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const [remoteEnabled, setRemoteEnabled] = useState(false)
  const saveRef = useRef<UjatScheduleAssignRemoteSave | null>(null)

  const handleBindRemoteSave = useCallback(
    (
      save: UjatScheduleAssignRemoteSave | null,
      meta: { saving: boolean; remoteEnabled: boolean }
    ) => {
      saveRef.current = save
      setSaving(meta.saving)
      setRemoteEnabled(meta.remoteEnabled)
    },
    []
  )

  const handleOpenScheduleSheet = () => {
    setScheduleSheetRefreshKey(key => key + 1)
    setScheduleSheetOpen(true)
  }

  const handleSave = useCallback(async () => {
    if (!remoteEnabled || !saveRef.current) {
      commitUjatScheduleAssignDraft(activeRegion)
      showAlert({ title: '안내', content: '임시 배정 내용이 저장되었습니다.' })
      return
    }
    const result = await saveRef.current()
    if (!result.ok) {
      showAlert({ title: '저장 실패', content: result.message })
      return
    }
    commitUjatScheduleAssignDraft(activeRegion)
    showAlert({ title: '안내', content: '임시 배정 내용이 저장되었습니다.' })
  }, [activeRegion, remoteEnabled, showAlert])

  return (
    <div className="ujat-schedule-assign-page">
      <CmsTextTabs
        className="ujat-schedule-assign-page__tabs-row ujat-institution-application-region-tabs"
        activeKey={activeRegion}
        onChange={setActiveRegion}
        wrap
        items={regionTabs.map(region => ({
          key: region.key as UjatInstitutionApplicationRegionKey,
          label: region.label,
        }))}
        trailing={
          <>
            <CmsButton
              type="button"
              variant="secondary"
              width={180}
              onClick={handleOpenScheduleSheet}
            >
              임시 교육 일정표 확인
            </CmsButton>
            <CmsButton
              type="button"
              variant="primary"
              width={140}
              disabled={saving}
              onClick={() => void handleSave()}
            >
              임시 배정 저장
            </CmsButton>
          </>
        }
      />

      <UjatInstitutionScheduleAssignSection
        key={activeRegion}
        regionKey={activeRegion}
        programId={programId}
        onBindRemoteSave={handleBindRemoteSave}
      />

      <UjatInstitutionScheduleSheetPreviewModal
        open={scheduleSheetOpen}
        refreshKey={scheduleSheetRefreshKey}
        onCancel={() => setScheduleSheetOpen(false)}
      />
    </div>
  )
}
