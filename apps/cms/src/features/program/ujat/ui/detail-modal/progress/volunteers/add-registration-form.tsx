/**
 * 교육 진행 > 참여 봉사자 — 관리자 대리 작성 폼 본문
 * 섹션 순서·메타는 `ujat-volunteer-add-registration-form-section-config`, 렌더는 로컬 SectionRenderer
 */

import type { ProgramParticipantApplicationEditorViewModel } from '@/features/template/hooks/use-program-participant-application-editor'
import { UJAT_VOLUNTEER_ADD_REGISTRATION_SECTIONS } from './add-registration-form-section-config'
import { UjatVolunteerAddRegistrationFormSectionRenderer } from './add-registration-form-section-renderer'
import type { UjatVolunteerAddRegistrationConsentState } from './terms-consent-section'

export type UjatEducationProgressVolunteerAddRegistrationFormProps = {
  vm: ProgramParticipantApplicationEditorViewModel
  memberId: string
  programId?: string | number | null
  consents: UjatVolunteerAddRegistrationConsentState
  onConsentsChange: (next: UjatVolunteerAddRegistrationConsentState) => void
}

export function UjatEducationProgressVolunteerAddRegistrationForm({
  vm,
  memberId,
  programId,
  consents,
  onConsentsChange,
}: UjatEducationProgressVolunteerAddRegistrationFormProps) {
  return (
    <div className="ujat-volunteer-add-registration__form-stack">
      {UJAT_VOLUNTEER_ADD_REGISTRATION_SECTIONS.map(section => (
        <UjatVolunteerAddRegistrationFormSectionRenderer
          key={section.key}
          section={section}
          vm={vm}
          memberId={memberId}
          programId={programId}
          consents={consents}
          onConsentsChange={onConsentsChange}
        />
      ))}
    </div>
  )
}
