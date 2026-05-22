/**
 * 교육 진행 > 참여 봉사자 — 관리자 대리 작성 폼 본문
 * 섹션 순서·메타는 `ujat-volunteer-add-registration-form-section-config`, 렌더는 로컬 SectionRenderer
 */

import type { ProgramParticipantApplicationEditorViewModel } from '@/features/template/hooks/use-program-participant-application-editor'
import { UJAT_VOLUNTEER_ADD_REGISTRATION_SECTIONS } from './ujat-volunteer-add-registration-form-section-config'
import { UjatVolunteerAddRegistrationFormSectionRenderer } from './ujat-volunteer-add-registration-form-section-renderer'

export type UjatEducationProgressVolunteerAddRegistrationFormProps = {
  vm: ProgramParticipantApplicationEditorViewModel
}

export function UjatEducationProgressVolunteerAddRegistrationForm({
  vm,
}: UjatEducationProgressVolunteerAddRegistrationFormProps) {
  return (
    <div className="ujat-volunteer-add-registration__form-stack">
      {UJAT_VOLUNTEER_ADD_REGISTRATION_SECTIONS.map(section => (
        <UjatVolunteerAddRegistrationFormSectionRenderer
          key={section.key}
          section={section}
          vm={vm}
        />
      ))}
    </div>
  )
}
