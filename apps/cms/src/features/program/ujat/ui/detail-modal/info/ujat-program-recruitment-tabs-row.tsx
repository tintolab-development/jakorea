import { CmsButton } from '@/shared/ui'
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
        canEdit || isEditMode ? (
          <CmsButton onClick={isEditMode ? onSave : onEdit}>
            {isEditMode ? '정보 저장' : '정보 수정'}
          </CmsButton>
        ) : null
      }
    />
  )
}
