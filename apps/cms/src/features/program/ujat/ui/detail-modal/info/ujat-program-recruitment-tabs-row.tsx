import { ProgramEditInfoActions } from '@/features/program/shared/ui/program-edit-info-actions'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import {
  UJAT_RECRUIT_TAB_KEYS,
  UJAT_RECRUIT_TAB_LABELS,
  type UjatRecruitTabKey,
} from './ujat-program-detail-recruitment-tabs'

export function UjatProgramRecruitmentTabsRow({
  activeTab,
  onSelectTab,
  canEdit,
  isEditMode,
  onEdit,
  onCancel,
  onSave,
}: {
  activeTab: UjatRecruitTabKey
  onSelectTab: (tab: UjatRecruitTabKey) => void
  canEdit: boolean
  isEditMode: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
}) {
  return (
    <CmsTextTabs
      className="ujat-program-recruitment-tabs-row"
      activeKey={activeTab}
      onChange={onSelectTab}
      items={UJAT_RECRUIT_TAB_KEYS.map(key => ({
        key,
        label: UJAT_RECRUIT_TAB_LABELS[key],
      }))}
      trailing={
        <ProgramEditInfoActions
          isEditing={isEditMode}
          disabled={!canEdit && !isEditMode}
          onEdit={onEdit}
          onCancel={onCancel}
          onSave={onSave}
        />
      }
    />
  )
}
