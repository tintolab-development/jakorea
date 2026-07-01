import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { PFButton, PFText } from '@/shared/ui'
import { renderMultilineText } from '../ui/render-multiline-text'
import { SignUpActions } from '../layout/sign-up-actions'
import { SignUpLayout } from '../layout/sign-up-layout'
import { StepHeader } from '../layout/step-header'
import styles from '../sign-up-page.module.css'

type Step1MemberTypeProps = {
  signUp: UseSignUpReturn
}

export function Step1MemberType({ signUp }: Step1MemberTypeProps) {
  const { step, memberType, navigation } = signUp

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <StepHeader
        title="회원 유형을 선택해 주세요"
        description="회원가입을 진행할 유형을 선택해 주세요."
        titleClassName={styles.title}
        descriptionClassName={styles.description}
      />

      <div className={styles['member-type-cards']}>
        {memberType.options.map(option => {
          const isSelected = memberType.selected === option.type
          const cardClassName = [
            styles['member-type-card'],
            isSelected ? styles['member-type-card-selected'] : undefined,
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
                className={styles['member-type-image']}
                src={option.imageUrl}
                alt=""
                aria-hidden="true"
              />
              <div className={styles['member-type-text']}>
                <PFText as="span" typo="hl-sm" color="black">
                  {option.title}
                </PFText>
                <div className={styles['member-type-description']}>
                  <PFText as="p" typo="bd-md-md" color="black">
                    {renderMultilineText(option.primaryDescription)}
                  </PFText>
                  <PFText as="p" typo="label-md" color="neutral-cool-500">
                    {renderMultilineText(option.secondaryDescription)}
                  </PFText>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <SignUpActions variant="default">
        <PFButton
          size="xlarge"
          width="100%"
          disabled={!memberType.selected}
          onClick={step.goNextFromStep1}
        >
          다음
        </PFButton>
      </SignUpActions>

      <div className={styles['sign-in-guide']}>
        <PFText typo="label-md" color="neutral-cool-500">
          이미 계정이 있으신가요?
        </PFText>
        <button className={styles['sign-in-link']} type="button" onClick={navigation.signIn}>
          <PFText typo="bd-md-md" color="black">
            로그인 하기
          </PFText>
        </button>
      </div>
    </SignUpLayout>
  )
}
