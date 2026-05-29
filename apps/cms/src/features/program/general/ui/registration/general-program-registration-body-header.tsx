import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import {
  GENERAL_PROGRAM_REGISTRATION_APPLICATION_TAB_LABELS,
  GENERAL_PROGRAM_REGISTRATION_PHASE_HINT,
  GENERAL_PROGRAM_RECRUIT_TAB_LABELS,
  getGeneralProgramRegistrationPhase,
  recruitTabKeyFromRegistrationStep,
  registrationStepFromRecruitTab,
  type GeneralProgramRegistrationApplicationTabKey,
  type GeneralProgramRegistrationStepKey,
  type GeneralProgramRecruitTabKey,
} from '@/features/program/general/model/general-program-registration-flow'
import '@/features/program/ujat/ui/registration/ujat-program-registration-body-header.css'

export function GeneralProgramRegistrationBodyHeader({
  activeStep,
  visibleRecruitTabKeys,
  visibleApplicationTabKeys,
  onSelectStep,
}: {
  activeStep: GeneralProgramRegistrationStepKey
  visibleRecruitTabKeys: readonly GeneralProgramRecruitTabKey[]
  visibleApplicationTabKeys: readonly GeneralProgramRegistrationApplicationTabKey[]
  onSelectStep: (key: GeneralProgramRegistrationStepKey) => void
}) {
  const phase = getGeneralProgramRegistrationPhase(activeStep)

  if (phase === 'program') {
    return (
      <p className="ujat-program-registration-body-header__hint">
        {GENERAL_PROGRAM_REGISTRATION_PHASE_HINT.program}
      </p>
    )
  }

  if (phase === 'recruitment') {
    if (visibleRecruitTabKeys.length === 0) return null
    const recruitTab =
      recruitTabKeyFromRegistrationStep(activeStep) ?? visibleRecruitTabKeys[0]
    const activeRecruitTab = visibleRecruitTabKeys.includes(recruitTab)
      ? recruitTab
      : visibleRecruitTabKeys[0]
    return (
      <CmsTextTabs
        className="ujat-program-registration-body-header__tabs"
        variant="list"
        activeKey={activeRecruitTab}
        onChange={(tab: GeneralProgramRecruitTabKey) =>
          onSelectStep(registrationStepFromRecruitTab(tab))
        }
        wrap
        ariaLabel="일반 프로그램 모집 정보"
        items={visibleRecruitTabKeys.map(key => ({
          key,
          label: GENERAL_PROGRAM_RECRUIT_TAB_LABELS[key],
        }))}
      />
    )
  }

  if (visibleApplicationTabKeys.length === 0) return null

  const applicationTab = activeStep as GeneralProgramRegistrationApplicationTabKey
  const activeApplicationTab = visibleApplicationTabKeys.includes(applicationTab)
    ? applicationTab
    : visibleApplicationTabKeys[0]

  return (
    <CmsTextTabs
      className="ujat-program-registration-body-header__tabs"
      variant="list"
      activeKey={activeApplicationTab}
      onChange={onSelectStep}
      wrap
      ariaLabel="일반 프로그램 신청 정보"
      items={visibleApplicationTabKeys.map(key => ({
        key,
        label: GENERAL_PROGRAM_REGISTRATION_APPLICATION_TAB_LABELS[key],
      }))}
    />
  )
}
