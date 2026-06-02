/**
 * 일반 프로그램 상세 — 모집 정보 탭 (참여자 / 강사 / 봉사자)
 */

import type { ReactNode } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { CmsButton } from '@/shared/ui'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import {
  InstructorRecruitmentSection,
  VolunteerRecruitmentSection,
} from '@/features/program/shared/ui/program-detail/project-info/recruitment/project-info-recruitment-section'
import {
  DetailInfoSection,
  InstructorDetailInfoSection,
  VolunteerDetailInfoSection,
} from '@/features/program/shared/ui/program-detail/project-info/detail-info/project-info-detail-info-section'
import {
  generalRecruitTabItems,
  type GeneralRecruitTabKey,
} from '@/features/program/general/lib/recruitment-tabs'
import { GeneralProgramParticipantRecruitmentInfoView } from './participant-recruitment-info-view'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './recruitment-view.css'

export function GeneralProgramRecruitmentView({
  program,
  sponsorName,
  activeRecruitTab,
  onRecruitTabChange,
  showInstructorTab,
  showVolunteerTab,
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
}: {
  program: Program
  sponsorName?: string
  activeRecruitTab: GeneralRecruitTabKey
  onRecruitTabChange: (tab: GeneralRecruitTabKey) => void
  showInstructorTab: boolean
  showVolunteerTab: boolean
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
}) {
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
        />
      )
      break
    case 'instructors':
      recruitment = (
        <InstructorRecruitmentSection
          program={program}
          sponsorName={sponsorName}
          isEditMode={isEditModeInstructors}
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
        <VolunteerRecruitmentSection
          program={program}
          sponsorName={sponsorName}
          isEditMode={isEditModeVolunteers}
          form={isEditModeVolunteers ? volunteersForm : undefined}
        />
      )
      detail = (
        <VolunteerDetailInfoSection
          program={program}
          isEditMode={isEditModeVolunteers}
          form={isEditModeVolunteers ? volunteersForm : undefined}
          onRegisterGetAdditionalContentHtml={registerVolunteersAdditionalHtml}
        />
      )
      break
    default: {
      const _exhaustive: never = activeRecruitTab
      return _exhaustive
    }
  }

  return (
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
          canWrite || isEditMode ? (
            <CmsButton onClick={isEditMode ? onSave : onEdit}>
              {isEditMode ? '정보 저장' : '정보 수정'}
            </CmsButton>
          ) : null
        }
      />
      <div className="recruitment-view__body">
        {recruitment}
        <div className="detail-info-form--gap">{detail}</div>
      </div>
    </div>
  )
}
