import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { PFButton, PFText } from '@/shared/ui'
import { renderMultilineText } from '../lib/multiline-text'
import { SignUpLayout } from '../layout/shell'
import { SignUpStepLayout } from '../layout/sign-up-step-layout'
import styles from '../wizard.module.css'

type MemberTypeStepProps = {
  signUp: UseSignUpReturn
}

export function MemberTypeStep({ signUp }: MemberTypeStepProps) {
  const { step, memberType, navigation } = signUp

  return (
    <SignUpLayout currentStep={step.progress.current} totalSteps={step.progress.total}>
      <SignUpStepLayout
        title="어떤 회원으로 가입할까요?"
        description="회원 유형에 따라 필요한 정보가 조금 달라요."
        actions={
          <PFButton
            size="xlarge"
            width="100%"
            disabled={!memberType.selected}
            onClick={step.goNextFromStep1}
          >
            다음
          </PFButton>
        }
        afterActions={
          <div className={styles.signInGuide}>
            <PFText typo="label-md" color="neutral-cool-500">
              이미 계정이 있으신가요?
            </PFText>
            <button className={styles.signInLink} type="button" onClick={navigation.signIn}>
              <PFText typo="bd-md-md" color="black">
                로그인하기
              </PFText>
            </button>
          </div>
        }
      >
        <div className={styles.memberTypeCards}>
          {memberType.options.map(option => {
            const isSelected = memberType.selected === option.type
            const cardClassName = [
              styles.memberTypeCard,
              isSelected ? styles.memberTypeCardSelected : undefined,
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <button
                className={cardClassName}
                type="button"
                aria-pressed={isSelected}
                key={option.type}
                onClick={() => memberType.setSelected(option.type)}
              >
                <img
                  className={styles.memberTypeImage}
                  src={option.imageUrl}
                  alt=""
                  aria-hidden="true"
                />
                <div className={styles.memberTypeText}>
                  <PFText as="span" typo="hl-sm" color="black">
                    {option.title}
                  </PFText>
                  <div className={styles.memberTypeDescription}>
                    <PFText as="p" typo="bd-md-md" color="black">
                      {renderMultilineText(option.primaryDescription, styles.memberTypeLineBreak)}
                    </PFText>
                    <PFText as="p" typo="label-md" color="neutral-cool-500">
                      {renderMultilineText(option.secondaryDescription, styles.memberTypeLineBreak)}
                    </PFText>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </SignUpStepLayout>
    </SignUpLayout>
  )
}
