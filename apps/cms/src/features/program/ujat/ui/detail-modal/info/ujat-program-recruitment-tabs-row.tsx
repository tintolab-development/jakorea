import { ProgramEditInfoActions } from '@/features/program/shared/ui/program-edit-info-actions'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import {
  UJAT_RECRUIT_TAB_KEYS,
  UJAT_RECRUIT_TAB_LABELS,
  type UjatRecruitTabKey,
} from './ujat-program-detail-recruitment-tabs'
import './ujat-program-recruitment.css'

export function UjatProgramRecruitmentTabsRow({
  activeTab,
  onSelectTab,
  canEdit,
  isEditMode,
  onEdit,
  onCancel,
  onSave,
  onOpenPreview,
}: {
  activeTab: UjatRecruitTabKey
  onSelectTab: (tab: UjatRecruitTabKey) => void
  canEdit: boolean
  isEditMode: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onOpenPreview?: (tab: UjatRecruitTabKey) => void
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
        <div className="ujat-program-recruitment-tabs-row__actions">
          <ProgramEditInfoActions
            isEditing={isEditMode}
            idleVariant="secondary"
            disabled={!canEdit && !isEditMode}
            onEdit={onEdit}
            onCancel={onCancel}
            onSave={onSave} />
          {onOpenPreview ? (
            <CmsButton
              type="button"
              variant="primary"
              size="large"
              onClick={() => onOpenPreview(activeTab)} >
              미리보기
            </CmsButton>
          ) : null}
        </div>
      }
    />
  )
}
