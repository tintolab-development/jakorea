/**
 * 일반 프로그램 상세 — 모집 정보 탭 (참여자 / 강사 / 봉사자)
 */

import { useCallback, type ReactNode } from 'react'
import type { SetURLSearchParams } from 'react-router-dom'
import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { CmsButton } from '@/shared/ui'
import {
  PROGRAM_EDIT_INFO_BUTTON_LABEL,
  resolveProgramEditInfoClick,
} from '@/features/program/shared/lib/program-edit-info-button'
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
import {
  GENERAL_PROGRAM_PARTICIPANT_RECRUITMENT_PREVIEW_ACTIVE,
  GENERAL_PROGRAM_PARTICIPANT_RECRUITMENT_PREVIEW_PARAM,
  isParticipantRecruitmentPreviewOpen,
} from '@/features/program/general/lib/general-program-detail-route'
import { GeneralProgramParticipantRecruitmentInfoView } from './participant-recruitment-info-view'
import { GeneralProgramInstructorRecruitmentInfoView } from './instructor-recruitment-info-view'
import { GeneralProgramVolunteerRecruitmentInfoView } from './volunteer-recruitment-info-view'
import { GeneralProgramVolunteerInterviewScheduleSection } from './volunteer-interview-schedule-section'
import { ParticipantRecruitmentPreviewModal } from './participant-recruitment-preview-modal'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './recruitment-view.css'

export function GeneralProgramRecruitmentView({
  program,
  sponsorName,
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
  onSave,
  searchParams,
  setSearchParams,
}: {
  program: Program
  sponsorName?: string
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
  onSave: () => void
  searchParams: URLSearchParams
  setSearchParams: SetURLSearchParams
}) {
  const previewOpen = isParticipantRecruitmentPreviewOpen(searchParams)

  const handleOpenPreview = useCallback(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.set(
          GENERAL_PROGRAM_PARTICIPANT_RECRUITMENT_PREVIEW_PARAM,
          GENERAL_PROGRAM_PARTICIPANT_RECRUITMENT_PREVIEW_ACTIVE
        )
        return next
      },
      { replace: false }
    )
  }, [setSearchParams])

  const handleClosePreview = useCallback(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete(GENERAL_PROGRAM_PARTICIPANT_RECRUITMENT_PREVIEW_PARAM)
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  const isEditMode =
    (activeRecruitTab === 'institutions' && isEditModeInstitutions) ||
    (activeRecruitTab === 'instructors' && isEditModeInstructors) ||
    (activeRecruitTab === 'volunteers' && isEditModeVolunteers)

  let recruitment: ReactNode
  let detail: ReactNode

  switch (activeRecruitTab) {
    case 'institutions':
      recruitment = (
        <GeneralProgramParticipantRecruitmentInfoView
          program={program}
          isEdit={isEditModeInstitutions}
          form={isEditModeInstitutions ? institutionsForm : undefined}
        />
      )
      detail = (
        <DetailInfoSection
          program={program}
          isEditMode={isEditModeInstitutions}
          form={isEditModeInstitutions ? institutionsForm : undefined}
          onRegisterGetAdditionalContentHtml={registerInstitutionsAdditionalHtml}
          showThumbnail
          showRecruitmentMethod={showParticipantRecruitmentMethod}
          recruitmentMethodLabel="지원 방법"
        />
      )
      break
    case 'instructors':
      recruitment = (
        <GeneralProgramInstructorRecruitmentInfoView
          program={program}
          isEdit={isEditModeInstructors}
          form={isEditModeInstructors ? instructorsForm : undefined}
        />
      )
      detail = (
        <InstructorDetailInfoSection
          program={program}
          isEditMode={isEditModeInstructors}
          form={isEditModeInstructors ? instructorsForm : undefined}
          onRegisterGetAdditionalContentHtml={registerInstructorsAdditionalHtml}
        />
      )
      break
    case 'volunteers':
      recruitment = (
        <GeneralProgramVolunteerRecruitmentInfoView
          program={program}
          isEdit={isEditModeVolunteers}
          form={isEditModeVolunteers ? volunteersForm : undefined}
        />
      )
      detail = (
        <>
          <VolunteerDetailInfoSection
            program={program}
            isEditMode={isEditModeVolunteers}
            form={isEditModeVolunteers ? volunteersForm : undefined}
            onRegisterGetAdditionalContentHtml={registerVolunteersAdditionalHtml}
          />
          <div className="detail-info-form--gap">
            <GeneralProgramVolunteerInterviewScheduleSection
              program={program}
              isEdit={isEditModeVolunteers}
              form={isEditModeVolunteers ? volunteersForm : undefined}
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

  const showHeaderActions = canWrite || isEditMode || activeRecruitTab === 'institutions'

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
          })}
          trailing={
            showHeaderActions ? (
              <div className="recruitment-view__header-actions">
                {canWrite || isEditMode ? (
                  <CmsButton
                    variant="primary"
                    size="large"
                    width={140}
                    onClick={resolveProgramEditInfoClick(isEditMode, {
                      onEnterEdit: onEdit,
                      onSaveEdit: onSave,
                    })}
                  >
                    {PROGRAM_EDIT_INFO_BUTTON_LABEL}
                  </CmsButton>
                ) : null}
                {activeRecruitTab === 'institutions' ? (
                  <CmsButton
                    type="button"
                    variant="primary"
                    size="large"
                    className="recruitment-view__preview-btn"
                    onClick={handleOpenPreview}
                  >
                    미리보기
                  </CmsButton>
                ) : null}
              </div>
            ) : null
          }
        />
        <div className="recruitment-view__body">
          {recruitment}
          <div className="detail-info-form--gap">{detail}</div>
        </div>
      </div>
      <ParticipantRecruitmentPreviewModal
        open={previewOpen}
        onClose={handleClosePreview}
        program={program}
        sponsorName={sponsorName}
      />
    </>
  )
}
