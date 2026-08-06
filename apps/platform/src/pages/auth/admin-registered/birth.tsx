import { useState } from 'react'
import {
  isBirthStepValid,
  validateBirthStep,
} from '@/features/auth/sign-up/identity/identity.logic'
import { formatBirthDateInput, type GenderType } from '@/features/auth/sign-up'
import {
  requireAdminRegisteredWizardState,
  updateAdminRegisteredWizardState,
} from '@/features/auth/admin-registered'
import { PFButton, PFText, PFTextInput } from '@/shared/ui'
import styles from './birth.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import { useNavigate } from 'react-router-dom'

export function AdminRegisteredBirthPage() {
  const navigate = useNavigate()
  const wizardState = requireAdminRegisteredWizardState()

  if (!wizardState) {
    return null
  }

  const [birthDate, setBirthDate] = useState(wizardState.birthDate ?? '')
  const [gender, setGender] = useState<GenderType | null>(wizardState.gender ?? null)
  const [message, setMessage] = useState('')

  const isValid = isBirthStepValid(birthDate, gender)

  const handleNext = () => {
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

    updateAdminRegisteredWizardState({ birthDate, gender })
    navigate('/auth/admin-registered/identity')
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
                onClick={() => handleGenderChange('male')}
              >
                남성
              </PFButton>
              <PFButton
                size="xlarge"
                variant="tertiary"
                selected={gender === 'female'}
                width="100%"
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
          <PFButton size="xlarge" width="100%" disabled={!isValid} onClick={handleNext}>
            다음
          </PFButton>
          <PFButton size="large" variant="text" width="100%" onClick={handlePrevious}>
            이전으로
          </PFButton>
        </div>
    </section>
  )
}
