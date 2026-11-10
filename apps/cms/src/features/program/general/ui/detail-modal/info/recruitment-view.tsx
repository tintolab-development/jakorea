/**
 * 일반 프로그램 상세 — 모집 정보 탭 (참여자 / 강사 / 봉사자)
 */

import { useCallback, type ReactNode } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { CmsButton } from '@/shared/ui'
import { ProgramEditInfoActions } from '@/features/program/shared/ui/program-edit-info-actions'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import {
  DetailInfoSection,
  InstructorDetailInfoSection,
  VolunteerDetailInfoSection,
} from '@/features/program/shared/ui/program-detail/project-info/detail-info/project-info-detail-info-section'
import {
  generalRecruitTabItems,
  type GeneralRecruitTabKey,
} from '@/features/program/general/lib/recruitment-tabs'
import { resolveGeneralRecruitDetailDisplayProgram } from '@/features/program/general/lib/general-recruit-overlay-to-program'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'
import { canGeneralProgramRecruitmentInfoEdit } from '@/features/program/general/lib/common-info-edit-policy'
import { recruitmentEditTypeForDetailTab } from '@/features/program/shared/lib/program-edit-window'
import { GeneralProgramParticipantRecruitmentInfoView } from './participant-recruitment-info-view'
import { GeneralProgramInstructorRecruitmentInfoView } from './instructor-recruitment-info-view'
import { GeneralProgramVolunteerRecruitmentInfoView } from './volunteer-recruitment-info-view'
import { GeneralProgramVolunteerInterviewScheduleSection } from './volunteer-interview-schedule-section'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './recruitment-view.css'

export function GeneralProgramRecruitmentView({
  program,
  activeRecruitTab,
  onRecruitTabChange,
  showInstructorTab,
  showVolunteerTab,
  showParticipantRecruitmentMethod = false,
  canWrite,
  isEditModeInstitutions,
  institutionsForm,
  registerInstitutionsAdditionalHtml,
  isEditModeInstructors,
  instructorsForm,
  registerInstructorsAdditionalHtml,
  isEditModeVolunteers,
  volunteersForm,
  registerVolunteersAdditionalHtml,
  onEdit,
  onCancel,
  onSave,
  onOpenRecruitmentPreview,
  remoteUnavailableReason,
  remoteStrict = false,
  variant = 'default',
}: {
  program: Program
  activeRecruitTab: GeneralRecruitTabKey
  onRecruitTabChange: (tab: GeneralRecruitTabKey) => void
  showInstructorTab: boolean
  showVolunteerTab: boolean
  showParticipantRecruitmentMethod?: boolean
  canWrite: boolean
  isEditModeInstitutions: boolean
  isEditModeInstructors: boolean
  isEditModeVolunteers: boolean
  institutionsForm?: UseFormReturn<ProgramDetailEditFormValues>
  instructorsForm?: UseFormReturn<ProgramDetailEditFormValues>
  volunteersForm?: UseFormReturn<ProgramDetailEditFormValues>
  registerInstitutionsAdditionalHtml: (getter: () => string) => void
  registerInstructorsAdditionalHtml: (getter: () => string) => void
  registerVolunteersAdditionalHtml: (getter: () => string) => void
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  /** 모집 사용자 미리보기 — URL·optimistic open은 상세 모달에서 처리 */
  onOpenRecruitmentPreview?: (tab: GeneralRecruitTabKey) => void
  /** 원격 SSOT 필수 응답이 없을 때 local seed 대신 표시할 오류 */
  remoteUnavailableReason?: string
  /** 교육받은 교사 원격 모드 — persisted/browser overlay를 모집 표시에서 제외 */
  remoteStrict?: boolean
  /**
   * `general`: 일반 프로그램 상세 시안(비고 「해당 없음」·placeholder·첨부 형식/개수·안내 문구).
   * 생략 시 기존 동작 — 1사1교·교육받은 교사 상세(`program-detail-fullpage-modal`).
   */
  variant?: 'default' | 'general'
}) {
  const handleOpenPreview = useCallback(() => {
    onOpenRecruitmentPreview?.(activeRecruitTab)
  }, [activeRecruitTab, onOpenRecruitmentPreview])

  if (remoteUnavailableReason != null) {
    return (
      <div className="recruitment-view program-detail-fullpage-modal__info-tab">
        <div className="recruitment-view__body recruitment-view__body--error" role="alert">
          {remoteUnavailableReason}
        </div>
      </div>
    )
  }

  const recruitmentEditable = canGeneralProgramRecruitmentInfoEdit(
    program,
    recruitmentEditTypeForDetailTab(activeRecruitTab)
  )
  const isEditMode =
    recruitmentEditable &&
    ((activeRecruitTab === 'institutions' && isEditModeInstitutions) ||
      (activeRecruitTab === 'instructors' && isEditModeInstructors) ||
      (activeRecruitTab === 'volunteers' && isEditModeVolunteers))

  let recruitment: ReactNode
  let detail: ReactNode

  switch (activeRecruitTab) {
    case 'institutions':
      recruitment = (
        <GeneralProgramParticipantRecruitmentInfoView
          program={program}
          isEdit={isEditModeInstitutions && recruitmentEditable}
          form={isEditModeInstitutions && recruitmentEditable ? institutionsForm : undefined}
          variant={variant}
        />
      )
      detail = (
        <DetailInfoSection
          program={resolveGeneralRecruitDetailDisplayProgram(program, 'participant', {
            strictRemote: remoteStrict,
          })}
          isEditMode={isEditModeInstitutions && recruitmentEditable}
          form={isEditModeInstitutions && recruitmentEditable ? institutionsForm : undefined}
          onRegisterGetAdditionalContentHtml={registerInstitutionsAdditionalHtml}
          showThumbnail
          showRecruitmentMethod={showParticipantRecruitmentMethod}
          recruitmentMethodLabel="지원 방법"
          emptyReadDisplay="dash"
          variant={variant}
        />
      )
      break
    case 'instructors':
      recruitment = (
        <GeneralProgramInstructorRecruitmentInfoView
          program={program}
          isEdit={isEditModeInstructors && recruitmentEditable}
          form={isEditModeInstructors && recruitmentEditable ? instructorsForm : undefined}
          variant={variant}
        />
      )
      detail = (
        <InstructorDetailInfoSection
          program={resolveGeneralRecruitDetailDisplayProgram(program, 'instructor', {
            strictRemote: remoteStrict,
          })}
          isEditMode={isEditModeInstructors && recruitmentEditable}
          form={isEditModeInstructors && recruitmentEditable ? instructorsForm : undefined}
          onRegisterGetAdditionalContentHtml={registerInstructorsAdditionalHtml}
          emptyReadDisplay="dash"
          variant={variant}
        />
      )
      break
    case 'volunteers':
      recruitment = (
        <GeneralProgramVolunteerRecruitmentInfoView
          program={program}
          isEdit={isEditModeVolunteers}
          form={isEditModeVolunteers ? volunteersForm : undefined}
          variant={variant}
        />
      )
      detail = (
        <>
          <VolunteerDetailInfoSection
            program={resolveGeneralRecruitDetailDisplayProgram(program, 'volunteer', {
              strictRemote: remoteStrict,
            })}
            isEditMode={isEditModeVolunteers && recruitmentEditable}
            form={isEditModeVolunteers && recruitmentEditable ? volunteersForm : undefined}
            onRegisterGetAdditionalContentHtml={registerVolunteersAdditionalHtml}
            emptyReadDisplay="dash"
            variant={variant}
          />
          <div className="detail-info-form--gap">
            <GeneralProgramVolunteerInterviewScheduleSection
              variant={variant}
              program={program}
              isEdit={isEditModeVolunteers && recruitmentEditable}
              form={isEditModeVolunteers && recruitmentEditable ? volunteersForm : undefined}
            />
          </div>
        </>
      )
      break
    default: {
      const _exhaustive: never = activeRecruitTab
      return _exhaustive
    }
  }

  return (
    <>
      <div className="recruitment-view program-detail-fullpage-modal__info-tab">
        <CmsTextTabs
          className="recruitment-view__tabs"
          activeKey={activeRecruitTab}
          onChange={key => onRecruitTabChange(key as GeneralRecruitTabKey)}
          items={generalRecruitTabItems({
            showInstructor: showInstructorTab,
            showVolunteer: showVolunteerTab,
            institutionsLabel:
              isGeneralIndividualProgram(program) || isTrainedTeachersDetailProgram(program)
                ? '참여자 모집 정보'
                : '참여 기관 모집 정보',
          })}
          // 권한 설정 V1.2: 조회 전용도 「정보 수정」 노출, 클릭 시 접근 불가 안내
          trailing={
            <div className="recruitment-view__header-actions">
              <ProgramEditInfoActions
                isEditing={isEditMode}
                idleVariant="secondary"
                canWrite={canWrite}
                onEdit={onEdit}
                onCancel={onCancel}
                onSave={onSave} />
              {onOpenRecruitmentPreview && !isEditMode ? (
                <CmsButton
                  type="button"
                  variant="primary"
                  size="large" className="recruitment-view__preview-btn"
                  onClick={handleOpenPreview} >
                  미리보기
                </CmsButton>
              ) : null}
            </div>
          }
        />
        <div className="recruitment-view__body">
          {recruitment}
          <div className="detail-info-form--gap">{detail}</div>
        </div>
      </div>
    </>
  )
}
