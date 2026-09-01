import { useState } from 'react'
import {
  formatBirthDateInput,
  isBirthStepValid,
  validateBirthStep,
  type GenderType,
} from '@/features/auth/sign-up'
import {
  applyAdminProvisionedOnboardingResponse,
  mapAdminProvisionedProfileRequest,
  normalizeAdminProvisionedOnboardingStep,
  requireAdminRegisteredWizardState,
  resolveAdminProvisionedOnboardingPath,
  getAdminRegisteredWizardState,
  updateAdminRegisteredWizardState,
  useAdminProvisionedProfileMutation,
} from '@/features/auth/admin-registered'
import { getLoginApiErrorMessage } from '@/features/auth/sign-in'
import { isRemoteApiConfigured } from '@/shared/lib'
import { PFButton, PFText, PFTextInput } from '@/shared/ui'
import styles from './birth.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import { useNavigate } from 'react-router-dom'

export function AdminRegisteredBirthPage() {
  const navigate = useNavigate()
  const wizardState = requireAdminRegisteredWizardState()
  const profileMutation = useAdminProvisionedProfileMutation()
  const [birthDate, setBirthDate] = useState(wizardState?.birthDate ?? '')
  const [gender, setGender] = useState<GenderType | null>(wizardState?.gender ?? null)
  const [message, setMessage] = useState('')

  if (!wizardState) {
    return null
  }

  const isValid = isBirthStepValid(birthDate, gender)
  const isSubmitting = profileMutation.isPending

  const handleNext = () => {
    void (async () => {
      const result = validateBirthStep(birthDate)

      if (result.status === 'invalid-format') {
        setMessage(result.message)
        return
      }

      if (result.status === 'under-age') {
        setMessage('만 14세 이상만 이용할 수 있어요.')
        return
      }

      if (!gender) {
        return
      }

      if (isRemoteApiConfigured()) {
        const body = mapAdminProvisionedProfileRequest({ birthDate, gender })
        if (!body) {
          setMessage('생년월일과 성별을 다시 확인해 주세요.')
          return
        }

        try {
          const onboarding = await profileMutation.mutateAsync(body)
          if (onboarding.profileCompleted === false) {
            setMessage('프로필 확인에 실패했어요. 다시 시도해 주세요.')
            return
          }
          applyAdminProvisionedOnboardingResponse(onboarding)
        } catch (error) {
          setMessage(
            getLoginApiErrorMessage(error, '생년월일·성별 확인에 실패했어요. 다시 시도해 주세요.'),
          )
          return
        }
      }

      updateAdminRegisteredWizardState({ birthDate, gender })

      if (isRemoteApiConfigured()) {
        let step =
          normalizeAdminProvisionedOnboardingStep(
            getAdminRegisteredWizardState()?.adminProvisionedOnboardingStep,
          ) ?? 'IDENTITY'
        if (step === 'PROFILE') {
          step = 'IDENTITY'
          applyAdminProvisionedOnboardingResponse({ adminProvisionedOnboardingStep: 'IDENTITY' })
        }
        navigate(resolveAdminProvisionedOnboardingPath(step) ?? '/auth/admin-registered/identity')
        return
      }

      navigate('/auth/admin-registered/identity')
    })()
  }

  const handlePrevious = () => {
    navigate('/auth/admin-registered/notice')
  }

  const handleBirthDateChange = (value: string) => {
    setBirthDate(formatBirthDateInput(value))
    setMessage('')
  }

  const handleGenderChange = (value: GenderType) => {
    setGender(value)
    setMessage('')
  }

  return (
    <section>
        <div className={styles.header}>
          <PFText as="h1" typo="hd-sm" color="black" className={authPageCopyClass('title')}>
            생년월일과 성별을 알려주세요
          </PFText>
          <PFText as="p" typo="bd-lg-rg" color="primary-800" className={authPageCopyClass('description')}>
            나이에 맞는 가입 절차를 안내하기 위해 필요해요.
            <br />
            다음 단계에서 본인인증 정보와 함께 확인할 수 있어요.
          </PFText>
        </div>

        <div className={styles.content}>
          <PFTextInput
            size="xlarge"
            label="생년월일"
            placeholder="YYYY.MM.DD"
            required
            inputMode="numeric"
            maxLength={10}
            autoComplete="bday"
            value={birthDate}
            onValueChange={handleBirthDateChange}
            disabled={isSubmitting}
          />

          <div className={styles.genderField}>
            <PFText
              as="span"
              typo="label-md"
              color="neutral-warm-500"
              className={styles.fieldLabel}
            >
              성별
            </PFText>
            <div className={styles.genderOptions}>
              <PFButton
                size="xlarge"
                variant="tertiary"
                selected={gender === 'male'}
                width="100%"
                disabled={isSubmitting}
                onClick={() => handleGenderChange('male')}
              >
                남성
              </PFButton>
              <PFButton
                size="xlarge"
                variant="tertiary"
                selected={gender === 'female'}
                width="100%"
                disabled={isSubmitting}
                onClick={() => handleGenderChange('female')}
              >
                여성
              </PFButton>
            </div>
          </div>
        </div>

        {message ? (
          <PFText as="p" typo="bd-sm-rg" color="error" className={styles.message}>
            {message}
          </PFText>
        ) : null}

        <div className={styles.actions}>
          <PFButton
            size="xlarge"
            width="100%"
            disabled={!isValid || isSubmitting}
            onClick={handleNext}
          >
            {isSubmitting ? '확인 중…' : '다음'}
          </PFButton>
          <PFButton
            size="large"
            variant="text"
            width="100%"
            disabled={isSubmitting}
            onClick={handlePrevious}
          >
            이전으로
          </PFButton>
        </div>
    </section>
  )
}
