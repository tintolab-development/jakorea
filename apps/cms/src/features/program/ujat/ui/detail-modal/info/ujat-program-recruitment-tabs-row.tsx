import { CmsButton } from '@/shared/ui'
import {
  PROGRAM_EDIT_INFO_BUTTON_LABEL,
  resolveProgramEditInfoClick,
} from '@/features/program/shared/lib/program-edit-info-button'
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
  onSave,
}: {
  activeTab: UjatRecruitTabKey
  onSelectTab: (tab: UjatRecruitTabKey) => void
  canEdit: boolean
  isEditMode: boolean
  onEdit: () => void
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
        <CmsButton
          variant="secondary"
          size="large"
          width={140}
          disabled={!canEdit && !isEditMode}
          onClick={resolveProgramEditInfoClick(isEditMode, {
            onEnterEdit: onEdit,
            onSaveEdit: onSave,
          })}
        >
          {PROGRAM_EDIT_INFO_BUTTON_LABEL}
        </CmsButton>
      }
    />
  )
}
