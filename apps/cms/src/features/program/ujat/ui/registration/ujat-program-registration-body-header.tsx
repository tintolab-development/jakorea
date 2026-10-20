import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import {
  UJAT_PROGRAM_REGISTRATION_PHASE_HINT,
  UJAT_PROGRAM_REGISTRATION_APPLICATION_TAB_KEYS,
  UJAT_PROGRAM_REGISTRATION_APPLICATION_TAB_LABELS,
  UJAT_RECRUIT_TAB_KEYS,
  UJAT_RECRUIT_TAB_LABELS,
  applicationTabKeyFromRegistrationStep,
  getUjatProgramRegistrationPhase,
  recruitTabKeyFromRegistrationStep,
  registrationStepFromApplicationTab,
  registrationStepFromRecruitTab,
  type UjatProgramRegistrationStepKey,
} from '@/features/program/ujat/model/ujat-program-registration-flow'
import type { UjatRecruitTabKey } from '@/features/program/ujat/ui/detail-modal/info/ujat-program-detail-recruitment-tabs'
import '@/features/program/shared/ui/registration/registration-body-header.css'

export function UjatProgramRegistrationBodyHeader({
  activeStep,
  onSelectStep,
}: {
  activeStep: UjatProgramRegistrationStepKey
  onSelectStep: (key: UjatProgramRegistrationStepKey) => void
}) {
  const phase = getUjatProgramRegistrationPhase(activeStep)

  if (phase === 'program') {
    return (
      <p className="registration-body-header__hint">
        {UJAT_PROGRAM_REGISTRATION_PHASE_HINT.program}
      </p>
    )
  }

  if (phase === 'application') {
    const applicationTab =
      applicationTabKeyFromRegistrationStep(activeStep) ??
      UJAT_PROGRAM_REGISTRATION_APPLICATION_TAB_KEYS[0]
    return (
      <CmsTextTabs
        className="registration-body-header__tabs"
        variant="list"
        activeKey={applicationTab}
        onChange={tab => onSelectStep(registrationStepFromApplicationTab(tab))}
        ariaLabel="UJAT 신청 정보"
        items={UJAT_PROGRAM_REGISTRATION_APPLICATION_TAB_KEYS.map(key => ({
          key,
          label: UJAT_PROGRAM_REGISTRATION_APPLICATION_TAB_LABELS[key],
        }))}
      />
    )
  }

  const recruitTab = recruitTabKeyFromRegistrationStep(activeStep) ?? 'recruit_participant'
  return (
    <CmsTextTabs
      className="registration-body-header__tabs"
      variant="list"
      activeKey={recruitTab}
      onChange={(tab: UjatRecruitTabKey) => onSelectStep(registrationStepFromRecruitTab(tab))}
      ariaLabel="UJAT 모집 정보"
      items={UJAT_RECRUIT_TAB_KEYS.map(key => ({
        key,
        label: UJAT_RECRUIT_TAB_LABELS[key],
      }))}
    />
  )
}
