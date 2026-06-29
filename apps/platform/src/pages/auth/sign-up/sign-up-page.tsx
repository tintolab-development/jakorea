import { useState } from 'react'
import { PFButton, PFStepProgress, PFText, PFTextInput } from '@/shared/ui'
import illustHouseUrl from '@/shared/assets/illustration/illust-house.svg'
import illustPeopleUrl from '@/shared/assets/illustration/illust-people.svg'
import checkOffLargeUrl from '@/shared/ui/icons/check-off-large.svg'
import checkOffSmallUrl from '@/shared/ui/icons/check-off-small.svg'
import checkOnLargeUrl from '@/shared/ui/icons/check-on-large.svg'
import checkOnSmallUrl from '@/shared/ui/icons/check-on-small.svg'
import { AddressSearchModal } from './address-search-modal'
import styles from './sign-up-page.module.css'

type MemberType = 'general' | 'teacher'
type GenderType = 'male' | 'female'
type AgreementKey = 'service' | 'privacy' | 'marketing' | 'portrait'
type EmailCheckStatus = 'idle' | 'success' | 'error'
type SchoolStatus = 'enrolled' | 'none'

const MIN_GENERAL_MEMBER_AGE = 14

const memberTypeOptions: {
  type: MemberType
  title: string
  primaryDescription: string
  secondaryDescription: string
  imageUrl: string
}[] = [
  {
    type: 'general',
    title: '일반회원',
    primaryDescription: 'JA Korea 프로그램과\n소식을 확인하고 참여할 수\n있어요.',
    secondaryDescription: '학생, 청소년, 일반 참여자라면\n일반회원으로 가입해 주세요.',
    imageUrl: illustPeopleUrl,
  },
  {
    type: 'teacher',
    title: '교사회원',
    primaryDescription: '학교나 기관에서\n교육 활동을 함께하는\n선생님을 위한 가입이에요.',
    secondaryDescription: '만 14세 이상만 가입할 수 있어요.\n가입 후 바로 이용이 가능해요.',
    imageUrl: illustHouseUrl,
  },
]

const agreementItems: {
  key: AgreementKey
  required: boolean
  label: string
  guide?: string
}[] = [
  { key: 'service', required: true, label: '서비스 이용약관' },
  { key: 'privacy', required: true, label: '개인정보 수집·이용 동의' },
  { key: 'marketing', required: false, label: '마케팅 정보 수신 동의' },
  {
    key: 'portrait',
    required: false,
    label: '초상권 수집·이용 동의',
    guide: '* 미동의 시 프로그램 참여가 불가능해요.',
  },
]

function renderMultilineText(text: string) {
  return text.split('\n').map((line, index, lines) => (
    <span key={`${line}-${index}`}>
      {line}
      {index < lines.length - 1 ? <br /> : null}
    </span>
  ))
}

function parseBirthDate(value: string) {
  const matched = value.trim().match(/^(\d{4})\.(\d{2})\.(\d{2})$/)

  if (!matched) {
    return null
  }

  const [, yearValue, monthValue, dayValue] = matched
  const year = Number(yearValue)
  const month = Number(monthValue)
  const day = Number(dayValue)
  const date = new Date(year, month - 1, day)

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }

  return date
}

function calculateInternationalAge(birthDateValue: string) {
  const birthDate = parseBirthDate(birthDateValue)

  if (!birthDate) {
    return null
  }

  const today = new Date()
  const hasBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate())

  return today.getFullYear() - birthDate.getFullYear() - (hasBirthdayPassed ? 0 : 1)
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function isValidPassword(value: string) {
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value)
}

export function SignUpPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedType, setSelectedType] = useState<MemberType | null>(null)
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<GenderType | null>(null)
  const [stepTwoMessage, setStepTwoMessage] = useState('')
  const [isIdentityVerified, setIsIdentityVerified] = useState(false)
  const [agreements, setAgreements] = useState<Record<AgreementKey, boolean>>({
    service: false,
    privacy: false,
    marketing: false,
    portrait: false,
  })
  const [email, setEmail] = useState('')
  const [emailCheckStatus, setEmailCheckStatus] = useState<EmailCheckStatus>('idle')
  const [emailMessage, setEmailMessage] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [schoolStatus, setSchoolStatus] = useState<SchoolStatus>('none')
  const [address, setAddress] = useState('')
  const [addressDetail, setAddressDetail] = useState('')
  const [volunteerId, setVolunteerId] = useState('')
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)

  const handleSignIn = () => {
    window.location.assign('/auth/sign-in')
  }

  const handleNextStep = () => {
    if (currentStep === 1 && selectedType) {
      setCurrentStep(2)
    }
  }

  const handleStepTwoNext = () => {
    const age = calculateInternationalAge(birthDate)

    if (age === null) {
      setStepTwoMessage('생년월일을 YYYY.MM.DD 형식으로 입력해 주세요.')
      return
    }

    if (age < MIN_GENERAL_MEMBER_AGE) {
      setStepTwoMessage('만 14세 미만 회원가입은 별도 프로세스로 진행됩니다.')
      return
    }

    setStepTwoMessage('')
    setCurrentStep(3)
  }

  const handlePreviousStep = () => {
    if (currentStep === 3 && isIdentityVerified) {
      setIsIdentityVerified(false)
      return
    }

    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isStepTwoValid = birthDate.trim().length > 0 && gender !== null
  const isAllAgreed = agreementItems.every(item => agreements[item.key])
  const isRequiredAgreed = agreementItems
    .filter(item => item.required)
    .every(item => agreements[item.key])

  const toggleAgreement = (key: AgreementKey) => {
    setAgreements(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleAllAgreements = () => {
    const nextValue = !isAllAgreed

    setAgreements({
      service: nextValue,
      privacy: nextValue,
      marketing: nextValue,
      portrait: nextValue,
    })
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    setEmailCheckStatus('idle')
    setEmailMessage('')
  }

  const handleEmailDuplicateCheck = () => {
    const normalizedEmail = email.trim()

    if (!isValidEmail(normalizedEmail)) {
      setEmailCheckStatus('error')
      setEmailMessage('이메일 형식으로 입력해주세요.')
      return
    }

    if (normalizedEmail.toLowerCase() === 'ja@gmail.com') {
      setEmailCheckStatus('error')
      setEmailMessage('이미 가입 된 이메일이에요.')
      return
    }

    setEmailCheckStatus('success')
    setEmailMessage('사용할 수 있는 이메일이에요.')
  }

  const handleAgreementContinue = () => {
    if (isRequiredAgreed) {
      setCurrentStep(4)
    }
  }

  const handleEmailNext = () => {
    if (emailCheckStatus === 'success') {
      setCurrentStep(5)
    }
  }

  const isPasswordMismatch = passwordConfirm.length > 0 && password !== passwordConfirm
  const isStepFiveValid = isValidPassword(password) && password === passwordConfirm
  const isStepSixValid = address.trim().length > 0 && addressDetail.trim().length > 0

  if (currentStep === 6) {
    return (
      <section className={styles.page}>
        <div className={styles.container}>
          <PFStepProgress currentStep={6} totalSteps={7} ariaLabel="회원가입 진행 단계" />

          <PFText as="div" typo="hd-sm" color="black" className={styles['profile-title']}>
            회원 정보를 입력해 주세요
          </PFText>

          <PFText
            as="p"
            typo="bd-lg-rg"
            color="primary-800"
            className={styles['profile-description']}
          >
            JA Korea 서비스를 더 편하게 이용할 수 있도록
            <br />
            필요한 정보를 확인해요.
          </PFText>

          <div className={styles['profile-content']}>
            <PFTextInput size="xlarge" label="이름" value="홍길동" required disabled />
            <PFTextInput
              size="xlarge"
              label="휴대폰 번호"
              value="010-1234-5678"
              required
              disabled
            />

            <div className={styles['school-status-field']}>
              <PFText as="span" typo="label-md" color="inherit" className={styles['field-label']}>
                현재 학교에 재학 중이신가요?{' '}
                <span className={styles['inline-required-mark']}>*</span>
              </PFText>
              <div className={styles['school-status-options']}>
                <PFButton
                  size="xlarge"
                  variant="tertiary"
                  selected={schoolStatus === 'enrolled'}
                  className={styles['school-status-button']}
                  onClick={() => setSchoolStatus('enrolled')}
                >
                  재학 중
                </PFButton>
                <PFButton
                  size="xlarge"
                  variant="tertiary"
                  selected={schoolStatus === 'none'}
                  className={styles['school-status-button']}
                  onClick={() => setSchoolStatus('none')}
                >
                  해당 없음
                </PFButton>
              </div>
            </div>

            <div className={styles['address-field']}>
              <PFText as="span" typo="label-md" color="inherit" className={styles['field-label']}>
                자택 주소 <span className={styles['inline-required-mark']}>*</span>
              </PFText>
              <div className={styles['address-search-row']}>
                <PFTextInput
                  size="xlarge"
                  placeholder="주소를 검색해 주세요"
                  value={address}
                  readOnly
                  onClick={() => setIsAddressModalOpen(true)}
                />
                <PFButton
                  size="xlarge"
                  variant="secondary"
                  className={styles['address-search-button']}
                  onClick={() => setIsAddressModalOpen(true)}
                >
                  주소 검색
                </PFButton>
              </div>
              <PFTextInput
                size="xlarge"
                placeholder="상세주소를 입력해 주세요"
                value={addressDetail}
                onValueChange={setAddressDetail}
              />
            </div>

            <PFTextInput
              size="xlarge"
              label="1365 ID"
              placeholder="1365 ID를 입력해 주세요"
              value={volunteerId}
              onValueChange={setVolunteerId}
            />
          </div>

          <div className={styles['terms-actions']}>
            <PFButton size="xlarge" className={styles['next-button']} disabled={!isStepSixValid}>
              가입 정보 확인하기
            </PFButton>
            <PFButton
              size="xlarge"
              variant="tertiary"
              className={styles['previous-button']}
              onClick={handlePreviousStep}
            >
              이전
            </PFButton>
          </div>

          <AddressSearchModal
            open={isAddressModalOpen}
            onClose={() => setIsAddressModalOpen(false)}
            onSelect={setAddress}
          />
        </div>
      </section>
    )
  }

  if (currentStep === 5) {
    return (
      <section className={styles.page}>
        <div className={styles.container}>
          <PFStepProgress currentStep={5} totalSteps={7} ariaLabel="회원가입 진행 단계" />

          <PFText as="div" typo="hd-sm" color="black" className={styles['password-title']}>
            비밀번호를 입력해 주세요
          </PFText>

          <PFText
            as="p"
            typo="bd-lg-rg"
            color="primary-800"
            className={styles['password-description']}
          >
            안전한 계정 이용을 위해
            <br />
            다른 곳에서 쓰지 않는 비밀번호를 추천해요.
          </PFText>

          <div className={styles['password-content']}>
            <PFTextInput
              size="xlarge"
              label="비밀번호"
              type="password"
              placeholder="비밀번호를 입력해 주세요."
              required
              value={password}
              onValueChange={setPassword}
              message="영문, 숫자, 특수문자를 조합해 8자 이상 입력해 주세요."
            />
            <PFTextInput
              size="xlarge"
              label="비밀번호 재입력"
              type="password"
              placeholder="비밀번호를 한 번 더 입력해 주세요"
              required
              value={passwordConfirm}
              onValueChange={setPasswordConfirm}
              message={
                isPasswordMismatch ? '비밀번호가 서로 달라요. 다시 한 번 확인해 주세요.' : undefined
              }
              messageStatus="error"
              error={isPasswordMismatch}
            />
          </div>

          <div className={styles['terms-actions']}>
            <PFButton
              size="xlarge"
              className={styles['next-button']}
              disabled={!isStepFiveValid}
              onClick={() => setCurrentStep(6)}
            >
              다음
            </PFButton>
            <PFButton
              size="xlarge"
              variant="tertiary"
              className={styles['previous-button']}
              onClick={handlePreviousStep}
            >
              이전
            </PFButton>
          </div>
        </div>
      </section>
    )
  }

  if (currentStep === 4) {
    return (
      <section className={styles.page}>
        <div className={styles.container}>
          <PFStepProgress currentStep={4} totalSteps={7} ariaLabel="회원가입 진행 단계" />

          <PFText as="div" typo="hd-sm" color="black" className={styles['email-title']}>
            로그인에 사용할
            <br />
            이메일을 입력해 주세요
          </PFText>

          <PFText
            as="p"
            typo="bd-lg-rg"
            color="primary-800"
            className={styles['email-description']}
          >
            로그인에 사용할 이메일 주소를 입력해 주세요. 자주 사용하는 이메일을 권장해요. 소셜
            계정은 가입을 마친 뒤 연결할 수 있어요.
          </PFText>

          <div className={styles['email-content']}>
            <PFTextInput
              size="xlarge"
              label="이메일"
              placeholder="이메일을 입력해 주세요."
              type="email"
              required
              value={email}
              onValueChange={handleEmailChange}
              message={emailMessage}
              messageStatus={emailCheckStatus === 'success' ? 'success' : 'error'}
              error={emailCheckStatus === 'error'}
            />
            <PFButton
              size="xlarge"
              variant="secondary"
              className={styles['duplicate-check-button']}
              onClick={handleEmailDuplicateCheck}
            >
              중복확인
            </PFButton>
          </div>

          <div className={styles['terms-actions']}>
            <PFButton
              size="xlarge"
              className={styles['next-button']}
              disabled={emailCheckStatus !== 'success'}
              onClick={handleEmailNext}
            >
              다음
            </PFButton>
            <PFButton
              size="xlarge"
              variant="tertiary"
              className={styles['previous-button']}
              onClick={handlePreviousStep}
            >
              이전
            </PFButton>
          </div>
        </div>
      </section>
    )
  }

  if (currentStep === 3) {
    if (isIdentityVerified) {
      return (
        <section className={styles.page}>
          <div className={styles.container}>
            <PFStepProgress currentStep={3} totalSteps={7} ariaLabel="회원가입 진행 단계" />

            <PFText as="div" typo="hd-sm" color="black" className={styles['terms-title']}>
              서비스 이용을 위한
              <br />
              약관에 동의해 주세요
            </PFText>

            <PFText
              as="p"
              typo="bd-lg-rg"
              color="primary-800"
              className={styles['terms-description']}
            >
              필수 항목 동의는 가입을 위해 꼭 필요해요.
            </PFText>

            <div className={styles['terms-content']}>
              <button
                className={[
                  styles['all-agreement-button'],
                  isAllAgreed ? styles['all-agreement-button-checked'] : undefined,
                ]
                  .filter(Boolean)
                  .join(' ')}
                type="button"
                aria-pressed={isAllAgreed}
                onClick={toggleAllAgreements}
              >
                <img
                  className={styles['check-icon']}
                  src={isAllAgreed ? checkOnLargeUrl : checkOffLargeUrl}
                  alt=""
                  aria-hidden="true"
                />
                <PFText typo="bd-lg-sb" color="inherit">
                  전체 동의하기
                </PFText>
              </button>

              <div className={styles['agreement-list']}>
                {agreementItems.map(item => (
                  <div className={styles['agreement-item']} key={item.key}>
                    <button
                      className={styles['agreement-check-button']}
                      type="button"
                      aria-pressed={agreements[item.key]}
                      onClick={() => toggleAgreement(item.key)}
                    >
                      <img
                        className={styles['agreement-check-icon']}
                        src={agreements[item.key] ? checkOnSmallUrl : checkOffSmallUrl}
                        alt=""
                        aria-hidden="true"
                      />
                      <span className={styles['agreement-text']}>
                        <PFText
                          typo="bd-sm-md"
                          color="inherit"
                          className={item.required ? styles.required : styles.optional}
                        >
                          {item.required ? '필수' : '선택'}
                        </PFText>
                        <PFText typo="bd-md-md" color="black">
                          {item.label}
                        </PFText>
                      </span>
                    </button>
                    <button className={styles['terms-view-button']} type="button">
                      <PFText typo="bd-sm-md" color="inherit">
                        보기
                      </PFText>
                    </button>
                    {item.guide ? (
                      <PFText
                        as="p"
                        typo="bd-sm-rg"
                        color="error"
                        className={styles['agreement-guide']}
                      >
                        {item.guide}
                      </PFText>
                    ) : null}
                  </div>
                ))}
              </div>

              <PFText
                as="p"
                typo="bd-sm-rg"
                color="neutral-warm-500"
                className={styles['optional-guide']}
              >
                선택 항목에 동의하지 않아도 회원가입은 가능해요.
              </PFText>
            </div>

            <div className={styles['terms-actions']}>
              <PFButton
                size="xlarge"
                className={styles['next-button']}
                disabled={!isRequiredAgreed}
                onClick={handleAgreementContinue}
              >
                동의하고 계속하기
              </PFButton>
              <PFButton
                size="xlarge"
                variant="tertiary"
                className={styles['previous-button']}
                onClick={handlePreviousStep}
              >
                이전
              </PFButton>
            </div>
          </div>
        </section>
      )
    }

    return (
      <section className={styles.page}>
        <div className={styles.container}>
          <PFStepProgress currentStep={3} totalSteps={7} ariaLabel="회원가입 진행 단계" />

          <PFText as="div" typo="hd-sm" color="black" className={styles.title}>
            본인인증을 진행해 주세요
          </PFText>

          <PFText as="p" typo="bd-lg-rg" color="primary-800" className={styles.description}>
            안전하게 가입하기 위해 휴대폰 본인인증이 필요해요. 인증 결과는 생년월일과 함께 확인하며,
            회원가입 절차에만 사용돼요.
          </PFText>

          <div className={styles['step-content']}>
            <div className={styles['identity-module']}>
              <PFText as="p" typo="bd-sm-rg" color="neutral-warm-500">
                통신사 본인인증 모듈 영역
                <br />
                수신: 이름·휴대폰번호·생년월일·CI/DI·인증토큰·인증일시
              </PFText>
            </div>
          </div>

          <div className={styles.actions}>
            <PFButton
              size="xlarge"
              className={styles['next-button']}
              onClick={() => setIsIdentityVerified(true)}
            >
              휴대폰 본인인증하기
            </PFButton>
          </div>
        </div>
      </section>
    )
  }

  if (currentStep === 2) {
    return (
      <section className={styles.page}>
        <div className={styles.container}>
          <PFStepProgress currentStep={2} totalSteps={7} ariaLabel="회원가입 진행 단계" />

          <PFText as="div" typo="hd-sm" color="black" className={styles.title}>
            생년월일과 성별을 알려주세요
          </PFText>

          <PFText as="p" typo="bd-lg-rg" color="primary-800" className={styles.description}>
            나이에 맞는 가입 절차를 안내하기 위해 필요해요.
            <br />
            다음 단계에서 본인인증 정보와 함께 확인할 수 있어요.
          </PFText>

          <div className={styles['step-content']}>
            <PFTextInput
              size="xlarge"
              label="생년월일"
              placeholder="YYYY.MM.DD"
              required
              value={birthDate}
              onValueChange={value => {
                setBirthDate(value)
                setStepTwoMessage('')
              }}
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
                  selected={gender === 'male'}
                  className={styles['gender-button']}
                  onClick={() => setGender('male')}
                >
                  남성
                </PFButton>
                <PFButton
                  size="xlarge"
                  variant="tertiary"
                  selected={gender === 'female'}
                  className={styles['gender-button']}
                  onClick={() => setGender('female')}
                >
                  여성
                </PFButton>
              </div>
            </div>
          </div>

          {stepTwoMessage ? (
            <PFText as="p" typo="bd-sm-rg" color="error" className={styles['step-message']}>
              {stepTwoMessage}
            </PFText>
          ) : null}

          <div className={styles.actions}>
            <PFButton
              size="xlarge"
              className={styles['next-button']}
              disabled={!isStepTwoValid}
              onClick={handleStepTwoNext}
            >
              다음
            </PFButton>
            <PFButton size="medium" variant="text" onClick={handlePreviousStep}>
              이전
            </PFButton>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <PFStepProgress currentStep={1} totalSteps={7} ariaLabel="회원가입 진행 단계" />

        <PFText as="div" typo="hd-sm" color="black" className={styles.title}>
          회원 유형을 선택해 주세요
        </PFText>

        <PFText as="p" typo="bd-lg-rg" color="primary-800" className={styles.description}>
          회원가입을 진행할 유형을 선택해 주세요.
        </PFText>

        <div className={styles['member-type-cards']}>
          {memberTypeOptions.map(option => {
            const isSelected = selectedType === option.type
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
                onClick={() => setSelectedType(option.type)}
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

        <div className={styles.actions}>
          <PFButton
            size="xlarge"
            className={styles['next-button']}
            disabled={!selectedType}
            onClick={handleNextStep}
          >
            다음
          </PFButton>
        </div>

        <div className={styles['sign-in-guide']}>
          <PFText typo="label-md" color="neutral-cool-500">
            이미 계정이 있으신가요?
          </PFText>
          <button className={styles['sign-in-link']} type="button" onClick={handleSignIn}>
            <PFText typo="bd-md-md" color="black">
              로그인 하기
            </PFText>
          </button>
        </div>
      </div>
    </section>
  )
}
