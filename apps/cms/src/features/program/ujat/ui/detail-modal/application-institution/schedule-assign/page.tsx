import { useCallback, useRef, useState } from 'react'
import { useCmsAlert } from '@/shared/ui'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { useUjatEducationRegions } from '@/features/program/ujat/hooks/use-ujat-education-regions'
import {
  isUjatInstitutionApplicationRegionKey,
  type UjatInstitutionApplicationRegionKey,
} from '../list/regions'
import { useUjatInstitutionEducationRegion } from '../use-institution-education-region'
import {
  UjatInstitutionScheduleAssignSection,
  type UjatScheduleAssignBindMeta,
  type UjatScheduleAssignRemoteSave,
} from './section'
import { UjatInstitutionScheduleSheetPreviewModal } from './schedule-sheet-preview-modal'
import { commitUjatScheduleAssignDraft } from './store'
import { TemporaryActionModal } from '../temporary-action-modal'
import './page.css'

export function UjatInstitutionScheduleAssignPage({
  programId,
}: {
  programId?: string | null
}) {
  const { showAlert } = useCmsAlert()
  const { regions: regionTabs } = useUjatEducationRegions()
  const { activeRegion, setActiveRegion } = useUjatInstitutionEducationRegion()
  const [scheduleSheetOpen, setScheduleSheetOpen] = useState(false)
  const [scheduleSheetRefreshKey, setScheduleSheetRefreshKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const [remoteEnabled, setRemoteEnabled] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [pendingInstitutionNames, setPendingInstitutionNames] = useState<string[]>([])
  const saveRef = useRef<UjatScheduleAssignRemoteSave | null>(null)

  const handleBindRemoteSave = useCallback(
    (save: UjatScheduleAssignRemoteSave | null, meta: UjatScheduleAssignBindMeta) => {
      saveRef.current = save
      setSaving(meta.saving)
      setRemoteEnabled(meta.remoteEnabled)
      setPendingInstitutionNames(meta.pendingInstitutionNames)
    },
    []
  )

  const handleOpenScheduleSheet = () => {
    setScheduleSheetRefreshKey(key => key + 1)
    setScheduleSheetOpen(true)
  }

  const requestSaveConfirm = useCallback(() => {
    if (!remoteEnabled || !saveRef.current) {
      showAlert({
        title: '저장 실패',
        content: '원격 API가 비활성 상태입니다. 로컬 저장으로 임시 배정 상태를 만들지 않습니다.',
      })
      return
    }
    if (pendingInstitutionNames.length === 0) {
      showAlert({
        title: '안내',
        content: '학급이 선택된 기관이 없습니다. 일정·학급을 배정한 뒤 저장해 주세요.',
      })
      return
    }
    setConfirmOpen(true)
  }, [pendingInstitutionNames.length, remoteEnabled, showAlert])

  const closeSaveConfirm = useCallback(() => {
    if (confirmLoading) return
    setConfirmOpen(false)
  }, [confirmLoading])

  const handleSave = useCallback(async () => {
    if (!remoteEnabled || !saveRef.current) {
      showAlert({
        title: '저장 실패',
        content: '원격 API가 비활성 상태입니다. 로컬 저장으로 임시 배정 상태를 만들지 않습니다.',
      })
      return
    }
    setConfirmLoading(true)
    try {
      const result = await saveRef.current()
      if (!result.ok) {
        showAlert({ title: '저장 결과', content: result.message })
        return
      }
      commitUjatScheduleAssignDraft(activeRegion)
      setConfirmOpen(false)
      showAlert({
        title: '저장 결과',
        content: result.message?.trim() || '임시 배정 내용이 저장되었습니다.',
      })
    } finally {
      setConfirmLoading(false)
    }
  }, [activeRegion, remoteEnabled, showAlert])

  return (
    <div className="ujat-schedule-assign-page">
      <CmsTextTabs
        className="ujat-schedule-assign-page__tabs-row ujat-institution-application-region-tabs"
        activeKey={activeRegion}
        onChange={key => {
          const next = String(key)
          if (isUjatInstitutionApplicationRegionKey(next)) setActiveRegion(next)
        }}
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
              disabled={saving || confirmLoading}
              onClick={requestSaveConfirm}
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
        programId={programId}
        onCancel={() => setScheduleSheetOpen(false)}
      />

      <TemporaryActionModal
        open={confirmOpen}
        kind="temp_assign"
        institutionNames={pendingInstitutionNames}
        loading={confirmLoading || saving}
        onCancel={closeSaveConfirm}
        onConfirm={handleSave}
      />
    </div>
  )
}
