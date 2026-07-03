import type { UseSignUpReturn } from '@/features/auth/sign-up'
import arrowRightUrl from '@/shared/assets/icons/arrow-right.svg'
import { PFButton, PFText, PFTextInput } from '@/shared/ui'
import { SignUpActions } from '../layout/actions'
import { SignUpLayout } from '../layout/shell'
import { StepHeader } from '../layout/step-header'
import styles from '../wizard.module.css'

type BirthStepProps = {
  signUp: UseSignUpReturn
}

export function BirthStep({ signUp }: BirthStepProps) {
  const { step, birth, memberType } = signUp
  const isTeacherSignup = memberType.selected === 'teacher'

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <StepHeader
        title="생년월일과 성별을 알려주세요"
        description={
          <>
            나이에 맞는 가입 절차를 안내하기 위해 필요해요.
            <br />
            다음 단계에서 본인인증 정보와 함께 확인할 수 있어요.
          </>
        }
        titleClassName={styles.title}
        descriptionClassName={styles.description}
      />

      <div className={styles['step-content']}>
        <PFTextInput
          size="xlarge"
          label="생년월일"
          placeholder="YYYY.MM.DD"
          required
          value={birth.birthDate}
          onValueChange={birth.setBirthDate}
        />

        <div className={styles['gender-field']}>
          <PFText
            as="span"
            typo="label-md"
            color="neutral-warm-500"
            className={styles['field-label']}
          >
            성별
          </PFText>
          <div className={styles['gender-options']}>
            <PFButton
              size="xlarge"
              variant="tertiary"
              selected={birth.gender === 'male'}
              width="100%"
              onClick={() => birth.setGender('male')}
            >
              남성
            </PFButton>
            <PFButton
              size="xlarge"
              variant="tertiary"
              selected={birth.gender === 'female'}
              width="100%"
              onClick={() => birth.setGender('female')}
            >
              여성
            </PFButton>
          </div>

          {isTeacherSignup ? (
            <div className={styles['teacher-birth-guide']}>
              <PFText as="p" typo="bd-sm-rg" color="primary-700">
                교사회원은{' '}
                <PFText as="span" typo="bd-sm-sb" color="primary-700">
                  만 14세 이상
                </PFText>
                만 가입할 수 있어요.
              </PFText>
              <button
                className={styles['teacher-general-sign-up-link']}
                type="button"
                onClick={memberType.switchToGeneral}
              >
                <PFText typo="label-md" color="black">
                  일반회원 가입하기
                </PFText>
                <img
                  className={styles['teacher-general-sign-up-arrow']}
                  src={arrowRightUrl}
                  alt=""
                  aria-hidden="true"
                />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {birth.message ? (
        <PFText as="p" typo="bd-sm-rg" color="error" className={styles['step-message']}>
          {birth.message}
        </PFText>
      ) : null}

      <SignUpActions variant="default">
        <PFButton
          size="xlarge"
          width="100%"
          disabled={!birth.isValid}
          onClick={step.goNextFromStep2}
        >
          다음
        </PFButton>
        <PFButton size="large" variant="text" onClick={step.goPrevious}>
          이전으로
        </PFButton>
      </SignUpActions>
    </SignUpLayout>
  )
}
