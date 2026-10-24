/**
 * 일반 프로그램 상세 — 신청 정보 탭 (참여 기관·강사·봉사자)
 */

import type { Program } from '@/types/domain'
import { CmsButton } from '@/shared/ui'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import {
  generalApplicationTabItems,
  getGeneralApplicationInstitutionsTabLabel,
  type GeneralApplicationTabKey,
} from '@/features/program/general/lib/application-tabs'
import { canGeneralProgramApplicationFormEdit } from '@/features/program/general/lib/common-info-edit-policy'
import { recruitmentEditTypeForDetailTab } from '@/features/program/shared/lib/program-edit-window'
import {
  PROGRAM_APPLICATION_FORM_EDIT_BLOCKED_ALERT_TITLE,
  PROGRAM_APPLICATION_FORM_EDIT_PERIOD_ENDED_MESSAGE,
} from '@/shared/lib/program-edit-window-error-message'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { ApplicationFormPreviewPanel } from './application-form-preview-panel'
import './application-view.css'

export function GeneralProgramApplicationView({
  program,
  activeApplicationTab,
  onApplicationTabChange,
  showInstructorTab,
  showVolunteerTab,
  canWrite,
  onEditForm,
  previewReloadKey = 0,
}: {
  program: Program
  activeApplicationTab: GeneralApplicationTabKey
  onApplicationTabChange: (tab: GeneralApplicationTabKey) => void
  showInstructorTab: boolean
  showVolunteerTab: boolean
  canWrite: boolean
  onEditForm: () => void
  previewReloadKey?: number
}) {
  const { showAlert } = useCmsAlert()
  const institutionsLabel = getGeneralApplicationInstitutionsTabLabel(program)
  const formWritable = canGeneralProgramApplicationFormEdit(
    program,
    recruitmentEditTypeForDetailTab(activeApplicationTab)
  )

  const handleEditForm = () => {
    if (!formWritable) {
      showAlert({
        title: PROGRAM_APPLICATION_FORM_EDIT_BLOCKED_ALERT_TITLE,
        content: PROGRAM_APPLICATION_FORM_EDIT_PERIOD_ENDED_MESSAGE,
      })
      return
    }
    onEditForm()
  }

  return (
    <div className="application-view program-detail-fullpage-modal__info-tab">
      <CmsTextTabs
        className="application-view__tabs"
        activeKey={activeApplicationTab}
        onChange={key => onApplicationTabChange(key as GeneralApplicationTabKey)}
        items={generalApplicationTabItems({
          showInstructor: showInstructorTab,
          showVolunteer: showVolunteerTab,
          institutionsLabel,
        })}
        trailing={
          canWrite ? (
            <CmsButton
              variant="secondary"
              size="large"
              onClick={handleEditForm}
            >
              양식 수정
            </CmsButton>
          ) : null
        }
      />
      <div className="application-view__body">
        <div className="application-view__notice" role="status">
          <p className="application-view__notice-text">현재 화면은 양식 미리보기 화면입니다.</p>
        </div>
        <ApplicationFormPreviewPanel
          program={program}
          applicationTab="institutions"
          active={activeApplicationTab === 'institutions'}
          reloadKey={previewReloadKey}
        />
        <ApplicationFormPreviewPanel
          program={program}
          applicationTab="instructors"
          active={activeApplicationTab === 'instructors'}
          reloadKey={previewReloadKey}
        />
        <ApplicationFormPreviewPanel
          program={program}
          applicationTab="volunteers"
          active={activeApplicationTab === 'volunteers'}
          reloadKey={previewReloadKey}
        />
        <div className="application-view__body-bottom" aria-hidden="true" />
      </div>
    </div>
  )
}
