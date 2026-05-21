import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import {
  UJAT_PROGRAM_REGISTRATION_APPLICATION_TAB_KEYS,
  UJAT_PROGRAM_REGISTRATION_APPLICATION_TAB_LABELS,
  UJAT_PROGRAM_REGISTRATION_PHASE_HINT,
  UJAT_RECRUIT_TAB_KEYS,
  UJAT_RECRUIT_TAB_LABELS,
  getUjatProgramRegistrationPhase,
  recruitTabKeyFromRegistrationStep,
  registrationStepFromRecruitTab,
  type UjatProgramRegistrationApplicationTabKey,
  type UjatProgramRegistrationStepKey,
} from '@/features/program/ujat/model/ujat-program-registration-flow'
import type { UjatRecruitTabKey } from '@/features/program/ujat/ui/detail-modal/info/ujat-program-detail-recruitment-tabs'
import './ujat-program-registration-body-header.css'

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
      <p className="ujat-program-registration-body-header__hint">
        {UJAT_PROGRAM_REGISTRATION_PHASE_HINT.program}
      </p>
    )
  }

  if (phase === 'recruitment') {
    const recruitTab = recruitTabKeyFromRegistrationStep(activeStep) ?? 'recruit_participant'
    return (
      <CmsTextTabs
        className="ujat-program-registration-body-header__tabs"
        variant="list"
        activeKey={recruitTab}
        onChange={(tab: UjatRecruitTabKey) => onSelectStep(registrationStepFromRecruitTab(tab))}
        wrap
        ariaLabel="UJAT 모집 정보"
        items={UJAT_RECRUIT_TAB_KEYS.map(key => ({
          key,
          label: UJAT_RECRUIT_TAB_LABELS[key],
        }))}
      />
    )
  }

  const applicationTab = activeStep as UjatProgramRegistrationApplicationTabKey
  return (
    <CmsTextTabs
      className="ujat-program-registration-body-header__tabs"
      variant="list"
      activeKey={applicationTab}
      onChange={onSelectStep}
      wrap
      ariaLabel="UJAT 신청 정보"
      items={UJAT_PROGRAM_REGISTRATION_APPLICATION_TAB_KEYS.map(key => ({
        key,
        label: UJAT_PROGRAM_REGISTRATION_APPLICATION_TAB_LABELS[key],
      }))}
    />
  )
}
