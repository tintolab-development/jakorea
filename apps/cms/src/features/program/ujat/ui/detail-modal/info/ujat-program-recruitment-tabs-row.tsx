import { CmsButton } from '@/shared/ui'
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
    <div className="program-detail-fullpage-modal__tabs-row ujat-program-recruitment-tabs-row">
      <div className="program-detail-fullpage-modal__tabs">
        {UJAT_RECRUIT_TAB_KEYS.map(key => (
          <button
            key={key}
            type="button"
            className={`program-detail-fullpage-modal__tab ${activeTab === key ? 'program-detail-fullpage-modal__tab--active' : ''}`}
            onClick={() => onSelectTab(key)}
          >
            <span className="program-detail-fullpage-modal__tab-label">{UJAT_RECRUIT_TAB_LABELS[key]}</span>
          </button>
        ))}
      </div>
      {canEdit || isEditMode ? (
        <div className="program-detail-fullpage-modal__header-actions">
          <CmsButton onClick={isEditMode ? onSave : onEdit}>
            {isEditMode ? '정보 저장' : '정보 수정'}
          </CmsButton>
        </div>
      ) : null}
    </div>
  )
}
