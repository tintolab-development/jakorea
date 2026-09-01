import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import type {
  AgreementKey,
  AgreementState,
  EmploymentStatus,
  GenderType,
  GuardianAgreementKey,
  GuardianAgreementState,
  MemberType,
  SchoolStatus,
} from '../model/sign-up.types'
import {
  memberTypeOptions,
  SIGN_IN_PATH,
  SIGN_UP_COMPLETE_PATH,
  SIGN_UP_TOTAL_STEPS,
  SIGN_UP_UNDER_AGE_TOTAL_STEPS,
  MOCK_VERIFIED_NAME,
  MOCK_VERIFIED_PHONE,
} from '../lib/constants'
import { toApiSignupPhone } from '../lib/helpers/to-api-phone'
import { buildConfirmationRows, formatBirthDateInput } from '../lib/utils'
import {
  createInitialAgreementState,
  getAgreementDerived,
  getAgreementItems,
  toggleAgreementState,
  toggleAllAgreementState,
} from '../lib/agreement/agreement.logic'
import {
  createInitialGuardianAgreementState,
  getGuardianAgreementDerived,
  guardianAgreementItems,
  toggleAllGuardianAgreementState,
  toggleGuardianAgreementState,
} from '../lib/agreement/guardian-agreement.logic'
import { validateEmailDuplicateCheck } from '../lib/email/email.logic'
import {
  ADMIN_REGISTERED_NOTICE_PATH,
  isMockAdminRegisteredEmail,
  isMockAdminRegisteredIdentityMatch,
  setAdminRegisteredPasswordChangeRequired,
  startAdminRegisteredFlowFromSignUp,
} from '@/features/auth/admin-registered'
import { getPasswordDerived } from '../lib/password/password.logic'
import { isProfileStepValid } from '../lib/profile/profile.logic'
import { isTeacherProfileValid } from '../lib/profile/teacher-profile.logic'
import { isGuardianProfileValid } from '../lib/guardian/guardian-profile.logic'
import { isBirthStepValid, validateBirthStep } from '../lib/identity/identity.logic'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { EMAIL_ID_MESSAGES, normalizeEmailId, validateEmailId } from '@/shared/lib/email-id'
import type { SelectedAddress } from '../ui/address-search-modal'
import type { SelectedSchool } from '../ui/school-search-modal'
import {
  getEmailAvailability,
  postGeneralSignup,
  postTeacherSignup,
  useSignupTermsQuery,
} from '../api'
import {
  mapSignUpToGeneralRequest,
  mapSignUpToTeacherRequest,
  toApiBirthDate,
  toApiMemberType,
} from '../model/mapper'
import {
  hasRequiredVerificationSessions,
  SIGNUP_IDENTITY_REQUIRED_MESSAGE,
} from '../model/validation'
import { getSignupApiErrorMessage } from '../lib/helpers'
import {
  buildSignUpSearch,
  isSignUpWizardLocationState,
  parseSignUpPhase,
  parseSignUpStep,
  type SignUpWizardPhase,
} from '../lib/wizard-location'

export type UseSignUpReturn = ReturnType<typeof useSignUp>

export function useSignUp() {
  const remoteApi = isRemoteApiConfigured()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const isUnderAgeSignupRef = useRef(false)
  const skipUrlSyncRef = useRef(false)
  const wizardPathname = location.pathname

  const [currentStep, setCurrentStep] = useState(() =>
    parseSignUpStep(searchParams, SIGN_UP_UNDER_AGE_TOTAL_STEPS),
  )
  const [selectedType, setSelectedType] = useState<MemberType | null>(null)
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<GenderType | null>(null)
  const [stepTwoMessage, setStepTwoMessage] = useState('')
  const [requiresGuardianConsent, setRequiresGuardianConsent] = useState(
    () => parseSignUpPhase(searchParams) === 'guardian-consent',
  )
  const [isUnderAgeSignup, setIsUnderAgeSignup] = useState(false)
  const [isGuardianAgreementCompleted, setIsGuardianAgreementCompleted] = useState(
    () => parseSignUpPhase(searchParams) === 'guardian-identity',
  )
  const [isGuardianIdentityVerified, setIsGuardianIdentityVerified] = useState(false)
  const [guardianAgreements, setGuardianAgreements] = useState<GuardianAgreementState>(
    createInitialGuardianAgreementState,
  )
  const [guardianRelationship, setGuardianRelationship] = useState('')
  const [isIdentityVerified, setIsIdentityVerified] = useState(
    () => parseSignUpPhase(searchParams) === 'agreement',
  )
  const [identityVerificationSessionId, setIdentityVerificationSessionId] = useState<number | null>(
    null,
  )
  const [guardianVerificationSessionId, setGuardianVerificationSessionId] = useState<number | null>(
    null,
  )
  const [verifiedName, setVerifiedName] = useState(MOCK_VERIFIED_NAME)
  const [verifiedPhone, setVerifiedPhone] = useState(MOCK_VERIFIED_PHONE)
  const [agreements, setAgreements] = useState<AgreementState>(createInitialAgreementState)
  const [email, setEmail] = useState('')
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [emailMessage, setEmailMessage] = useState('')
  const [isEmailChecking, setIsEmailChecking] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [schoolStatus, setSchoolStatus] = useState<SchoolStatus>('none')
  const [schoolName, setSchoolName] = useState('')
  const [schoolAddress, setSchoolAddress] = useState('')
  const [schoolNeisCode, setSchoolNeisCode] = useState<string | null>(null)
  const [schoolOrganizationId, setSchoolOrganizationId] = useState<number | null>(null)
  const [grade, setGrade] = useState('')
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus | null>('employed')
  const [address, setAddress] = useState('')
  const [addressDetail, setAddressDetail] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [regionSido, setRegionSido] = useState('')
  const [regionSigungu, setRegionSigungu] = useState('')
  const [volunteerId, setVolunteerId] = useState('')
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [isSchoolSearchModalOpen, setIsSchoolSearchModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')

  isUnderAgeSignupRef.current = isUnderAgeSignup

  const totalSteps = isUnderAgeSignup ? SIGN_UP_UNDER_AGE_TOTAL_STEPS : SIGN_UP_TOTAL_STEPS

  const pushWizard = (step: number, phase?: SignUpWizardPhase | null) => {
    skipUrlSyncRef.current = true
    setCurrentStep(step)
    navigate(
      { pathname: wizardPathname, search: `?${buildSignUpSearch(step, phase)}` },
      { replace: false, state: { signupWizard: true } },
    )
  }

  const replaceWizard = (step: number, phase?: SignUpWizardPhase | null) => {
    skipUrlSyncRef.current = true
    setCurrentStep(step)
    navigate(
      { pathname: wizardPathname, search: `?${buildSignUpSearch(step, phase)}` },
      { replace: true, state: { signupWizard: true } },
    )
  }

  const applyWizardFromUrl = (step: number, phase: SignUpWizardPhase | null) => {
    setCurrentStep(step)

    if (step === 2) {
      setRequiresGuardianConsent(phase === 'guardian-consent')
    }

    if (step === 3) {
      if (isUnderAgeSignupRef.current) {
        if (phase === 'guardian-identity') {
          setIsGuardianAgreementCompleted(true)
          setIsGuardianIdentityVerified(false)
        } else {
          setIsGuardianAgreementCompleted(false)
          setIsGuardianIdentityVerified(false)
        }
      } else if (phase === 'agreement') {
        setIsIdentityVerified(true)
      } else {
        setIsIdentityVerified(false)
      }
    }

    if (step >= 4) {
      if (isUnderAgeSignupRef.current) {
        setIsGuardianAgreementCompleted(true)
        setIsGuardianIdentityVerified(true)
      } else {
        setIsIdentityVerified(true)
      }
    }
  }

  useEffect(() => {
    if (!searchParams.get('step')) {
      setSearchParams(buildSignUpSearch(1), { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false
      return
    }

    const step = parseSignUpStep(searchParams, SIGN_UP_UNDER_AGE_TOTAL_STEPS)
    const phase = parseSignUpPhase(searchParams)
    applyWizardFromUrl(step, phase)
    // URL pop/push from browser or external navigation only
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync intentionally driven by searchParams
  }, [searchParams])

  const birthDateIso = toApiBirthDate(birthDate) ?? null
  const apiMemberType = selectedType ? toApiMemberType(selectedType) : null

  const termsQuery = useSignupTermsQuery({
    memberType: apiMemberType,
    birthDateIso,
    enabled: Boolean(selectedType && birthDateIso),
  })

  const visibleAgreementItems = getAgreementItems(selectedType)
  const agreementDerived = getAgreementDerived(agreements, visibleAgreementItems)
  const guardianAgreementDerived = getGuardianAgreementDerived(guardianAgreements)
  const passwordDerived = getPasswordDerived(password, passwordConfirm)
  const isStepTwoValid = isBirthStepValid(birthDate, gender)
  const isStepSixValid =
    selectedType === 'teacher'
      ? isTeacherProfileValid(schoolName, employmentStatus)
      : isProfileStepValid(address, addressDetail, schoolStatus, schoolName, grade)
  const isGuardianProfileValidState = isGuardianProfileValid(guardianRelationship)

  const handleSignIn = () => {
    navigate(SIGN_IN_PATH)
  }

  const handleNextStep = () => {
    if (currentStep === 1 && selectedType) {
      pushWizard(2)
    }
  }

  const handleStepTwoNext = () => {
    const result = validateBirthStep(birthDate)

    if (result.status === 'invalid-format') {
      setIsUnderAgeSignup(false)
      setRequiresGuardianConsent(false)
      setStepTwoMessage(result.message)
      return
    }

    if (result.status === 'under-age') {
      if (selectedType === 'teacher') {
        setStepTwoMessage('교사회원은 만 14세 이상만 가입할 수 있어요.')
        return
      }

      setStepTwoMessage('')
      setIsUnderAgeSignup(true)
      setRequiresGuardianConsent(true)
      pushWizard(2, 'guardian-consent')
      return
    }

    setStepTwoMessage('')
    setIsUnderAgeSignup(false)
    setRequiresGuardianConsent(false)
    pushWizard(3, 'identity')
  }

  const handleSwitchToGeneralMember = () => {
    setSelectedType('general')
    setStepTwoMessage('')
    setRequiresGuardianConsent(false)
    setIsUnderAgeSignup(false)
  }

  const applyPreviousStepProgrammatically = () => {
    if (currentStep === 2 && requiresGuardianConsent) {
      setRequiresGuardianConsent(false)
      replaceWizard(2)
      return
    }

    if (currentStep === 3 && isUnderAgeSignup) {
      if (isGuardianIdentityVerified) {
        setIsGuardianIdentityVerified(false)
        replaceWizard(3, 'guardian-identity')
        return
      }

      if (isGuardianAgreementCompleted) {
        setIsGuardianAgreementCompleted(false)
        replaceWizard(3, 'guardian-agreement')
        return
      }

      setRequiresGuardianConsent(true)
      replaceWizard(2, 'guardian-consent')
      return
    }

    if (currentStep === 4 && isUnderAgeSignup) {
      setIsGuardianIdentityVerified(false)
      replaceWizard(3, 'guardian-identity')
      return
    }

    if (currentStep === 3 && isIdentityVerified) {
      setIsIdentityVerified(false)
      replaceWizard(3, 'identity')
      return
    }

    if (currentStep > 1) {
      const previousStep = currentStep - 1
      let phase: SignUpWizardPhase | null = null
      if (previousStep === 3) {
        phase = isUnderAgeSignup ? 'guardian-identity' : 'agreement'
      }
      if (previousStep === 2 && isUnderAgeSignup && currentStep === 3) {
        phase = 'guardian-consent'
      }
      replaceWizard(previousStep, phase)
    }
  }

  const handlePreviousStep = () => {
    if (currentStep <= 1 && !requiresGuardianConsent) {
      return
    }

    if (isSignUpWizardLocationState(location.state)) {
      navigate(-1)
      return
    }

    applyPreviousStepProgrammatically()
  }

  const handleGoToStep = (step: number) => {
    pushWizard(step)
  }

  const toggleAgreement = (key: AgreementKey) => {
    setAgreements(prev => toggleAgreementState(prev, key))
  }

  const toggleAllAgreements = () => {
    setAgreements(prev => toggleAllAgreementState(prev, visibleAgreementItems))
  }

  const toggleGuardianAgreement = (key: GuardianAgreementKey) => {
    setGuardianAgreements(prev => toggleGuardianAgreementState(prev, key))
  }

  const toggleAllGuardianAgreements = () => {
    setGuardianAgreements(prev => toggleAllGuardianAgreementState(prev))
  }

  const handleGuardianAgreementContinue = () => {
    if (guardianAgreementDerived.isRequiredAgreed) {
      setIsGuardianAgreementCompleted(true)
      pushWizard(3, 'guardian-identity')
    }
  }

  const handleIdentitySuccess = (result: {
    sessionId: number
    verifiedName?: string
    verifiedPhone?: string
  }) => {
    setIdentityVerificationSessionId(result.sessionId)
    if (result.verifiedName?.trim()) setVerifiedName(result.verifiedName.trim())
    if (result.verifiedPhone?.trim()) {
      setVerifiedPhone(toApiSignupPhone(result.verifiedPhone) ?? result.verifiedPhone.trim())
    }
    setIsIdentityVerified(true)
    pushWizard(3, 'agreement')
  }

  const handleGuardianIdentitySuccess = (result: {
    sessionId: number
    verifiedName?: string
    verifiedPhone?: string
  }) => {
    setGuardianVerificationSessionId(result.sessionId)
    if (result.verifiedName?.trim()) setVerifiedName(result.verifiedName.trim())
    if (result.verifiedPhone?.trim()) {
      setVerifiedPhone(toApiSignupPhone(result.verifiedPhone) ?? result.verifiedPhone.trim())
    }
    setIsGuardianIdentityVerified(true)
    pushWizard(4)
  }

  const handleGuardianProfileContinue = () => {
    if (isGuardianProfileValidState) {
      pushWizard(5)
    }
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    setEmailCheckStatus('idle')
    setEmailMessage('')
  }

  const handleEmailDuplicateCheck = async () => {
    if (isEmailChecking) return

    if (!remoteApi) {
      const result = validateEmailDuplicateCheck(email)

      if (result.shouldRedirectToAdminRegisteredNotice) {
        setAdminRegisteredPasswordChangeRequired(email, 'sign-up')
        navigate('/auth/admin-registered/notice')
        return
      }

      setEmailCheckStatus(result.status)
      setEmailMessage(result.message)
      return
    }

    const validation = validateEmailId(email)
    if (!validation.ok) {
      setEmailCheckStatus('error')
      setEmailMessage(validation.message)
      return
    }

    const normalizedEmail = validation.normalized

    if (isMockAdminRegisteredEmail(normalizedEmail)) {
      setAdminRegisteredPasswordChangeRequired(normalizedEmail, 'sign-up')
      navigate('/auth/admin-registered/notice')
      return
    }

    setIsEmailChecking(true)
    setEmailMessage('')

    try {
      const response = await getEmailAvailability(normalizedEmail)
      const available = response.available === true
      setEmailCheckStatus(available ? 'success' : 'error')
      setEmailMessage(
        response.message?.trim() ||
          (available ? '사용할 수 있는 이메일이에요.' : EMAIL_ID_MESSAGES.duplicate),
      )
      if (available) {
        setEmail(normalizeEmailId(normalizedEmail))
      }
    } catch (error) {
      setEmailCheckStatus('error')
      setEmailMessage(
        getSignupApiErrorMessage(error, '이메일 확인에 실패했어요. 잠시 후 다시 시도해 주세요.'),
      )
    } finally {
      setIsEmailChecking(false)
    }
  }

  const handleAgreementContinue = () => {
    if (agreementDerived.isRequiredAgreed) {
      pushWizard(4)
    }
  }

  const handleEmailNext = () => {
    if (emailCheckStatus === 'success') {
      pushWizard(isUnderAgeSignup ? 6 : 5)
    }
  }

  const handleSchoolStatusChange = (status: SchoolStatus) => {
    setSchoolStatus(status)

    if (status === 'none') {
      setSchoolName('')
      setSchoolAddress('')
      setSchoolNeisCode(null)
      setSchoolOrganizationId(null)
      setGrade('')
    }
  }

  const handleSchoolNameChange = (value: string) => {
    setSchoolName(value)
    setSchoolAddress('')
    setSchoolNeisCode(null)
    setSchoolOrganizationId(null)
  }

  const handleSchoolSelect = (school: SelectedSchool) => {
    setSchoolName(school.name)
    setSchoolAddress(school.address?.trim() ?? '')
    setSchoolNeisCode(school.neisCode?.trim() || null)
    setSchoolOrganizationId(school.organizationId ?? null)
  }

  const handleAddressSelect = (selection: SelectedAddress) => {
    setAddress(selection.address)
    setPostalCode(selection.postalCode ?? '')
    setRegionSido(selection.regionSido ?? '')
    setRegionSigungu(selection.regionSigungu ?? '')
  }

  const handlePasswordContinue = () => {
    pushWizard(isUnderAgeSignup ? 7 : 6)
  }

  const handleProfileContinue = () => {
    pushWizard(isUnderAgeSignup ? 8 : 7)
  }

  const handleBirthDateChange = (value: string) => {
    setBirthDate(formatBirthDateInput(value))
    setStepTwoMessage('')
    setRequiresGuardianConsent(false)
    setIsUnderAgeSignup(false)
    setIsGuardianAgreementCompleted(false)
    setIsGuardianIdentityVerified(false)
    setGuardianAgreements(createInitialGuardianAgreementState())
    setGuardianRelationship('')
    setIsIdentityVerified(false)
    setIdentityVerificationSessionId(null)
    setGuardianVerificationSessionId(null)
    setVerifiedName(MOCK_VERIFIED_NAME)
    setVerifiedPhone(MOCK_VERIFIED_PHONE)
    if (parseSignUpPhase(searchParams)) {
      replaceWizard(2)
    }
  }

  const handleStartGuardianConsent = () => {
    setRequiresGuardianConsent(false)
    setIsGuardianAgreementCompleted(false)
    setIsGuardianIdentityVerified(false)
    setGuardianAgreements(createInitialGuardianAgreementState())
    setGuardianRelationship('')
    setGuardianVerificationSessionId(null)
    setVerifiedName(MOCK_VERIFIED_NAME)
    setVerifiedPhone(MOCK_VERIFIED_PHONE)
    pushWizard(3, 'guardian-agreement')
  }

  const handleSignupComplete = async () => {
    setSubmitMessage('')

    if (!remoteApi) {
      navigate(SIGN_UP_COMPLETE_PATH, { replace: true })
      return
    }

    if (!selectedType) {
      setSubmitMessage('회원 유형을 다시 확인해 주세요.')
      return
    }

    if (
      !hasRequiredVerificationSessions({
        isUnderAgeSignup,
        identityVerificationSessionId,
        guardianVerificationSessionId,
      })
    ) {
      setSubmitMessage(SIGNUP_IDENTITY_REQUIRED_MESSAGE)
      return
    }

    if (selectedType === 'teacher' && !schoolName.trim()) {
      setSubmitMessage('소속 학교를 검색에서 선택해 주세요.')
      return
    }

    const mapInput = {
      selectedType,
      email,
      password,
      birthDate,
      gender,
      isUnderAgeSignup,
      isIdentityVerified,
      identityVerificationSessionId,
      guardianVerificationSessionId,
      schoolStatus,
      schoolName,
      schoolOrganizationId,
      schoolNeisCode,
      schoolAddress,
      grade,
      employmentStatus,
      address,
      addressDetail,
      postalCode,
      regionSido,
      regionSigungu,
      volunteerId,
      name: verifiedName,
      phone: verifiedPhone,
      agreements,
      guardianAgreements,
      termsCatalog: termsQuery.data ?? null,
    }

    setIsSubmitting(true)

    try {
      if (selectedType === 'teacher') {
        const body = mapSignUpToTeacherRequest(mapInput)
        if (!body) {
          setSubmitMessage('소속 학교를 검색에서 선택해 주세요.')
          return
        }
        await postTeacherSignup(body)
      } else {
        await postGeneralSignup(mapSignUpToGeneralRequest(mapInput))
      }

      navigate(SIGN_UP_COMPLETE_PATH, { replace: true })
    } catch (error) {
      setSubmitMessage(
        getSignupApiErrorMessage(error, '가입에 실패했어요. 입력 정보를 확인한 뒤 다시 시도해 주세요.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmationRows = buildConfirmationRows({
    selectedType,
    birthDate,
    gender,
    schoolStatus,
    address,
    addressDetail,
    email,
    volunteerId,
    name: verifiedName,
    phone: verifiedPhone,
    schoolName,
    schoolAddress,
    employmentStatus,
  })

  return {
    step: {
      current: currentStep,
      total: totalSteps,
      goTo: handleGoToStep,
      goPrevious: handlePreviousStep,
      goNextFromStep1: handleNextStep,
      goNextFromStep2: handleStepTwoNext,
    },
    memberType: {
      selected: selectedType,
      setSelected: setSelectedType,
      switchToGeneral: handleSwitchToGeneralMember,
      options: memberTypeOptions,
    },
    birth: {
      birthDate,
      setBirthDate: handleBirthDateChange,
      gender,
      setGender,
      message: stepTwoMessage,
      isValid: isStepTwoValid,
      requiresGuardianConsent,
      startGuardianConsent: handleStartGuardianConsent,
    },
    guardian: {
      isUnderAgeSignup,
      isAgreementCompleted: isGuardianAgreementCompleted,
      agreement: {
        items: guardianAgreementItems,
        state: guardianAgreements,
        isAllAgreed: guardianAgreementDerived.isAllAgreed,
        isRequiredAgreed: guardianAgreementDerived.isRequiredAgreed,
        toggle: toggleGuardianAgreement,
        toggleAll: toggleAllGuardianAgreements,
        continue: handleGuardianAgreementContinue,
      },
      identity: {
        isVerified: isGuardianIdentityVerified,
        sessionId: guardianVerificationSessionId,
        complete: handleGuardianIdentitySuccess,
      },
      profile: {
        name: verifiedName,
        phone: verifiedPhone,
        relationship: guardianRelationship,
        setRelationship: setGuardianRelationship,
        isValid: isGuardianProfileValidState,
        continue: handleGuardianProfileContinue,
      },
    },
    identity: {
      isVerified: isIdentityVerified,
      verifiedName,
      verifiedPhone,
      sessionId: identityVerificationSessionId,
      complete: handleIdentitySuccess,
      tryAdminRegisteredRedirect: () => {
        if (isMockAdminRegisteredIdentityMatch(birthDate)) {
          if (!gender) {
            return false
          }

          startAdminRegisteredFlowFromSignUp({ birthDate, gender })
          navigate(ADMIN_REGISTERED_NOTICE_PATH)
          return true
        }
        return false
      },
      resetVerified: () => {
        setIsIdentityVerified(false)
        setIdentityVerificationSessionId(null)
        setVerifiedName(MOCK_VERIFIED_NAME)
        setVerifiedPhone(MOCK_VERIFIED_PHONE)
        replaceWizard(3, 'identity')
      },
    },
    agreement: {
      items: visibleAgreementItems,
      state: agreements,
      isAllAgreed: agreementDerived.isAllAgreed,
      isRequiredAgreed: agreementDerived.isRequiredAgreed,
      toggle: toggleAgreement,
      toggleAll: toggleAllAgreements,
      continue: handleAgreementContinue,
      termsLoading: termsQuery.isFetching,
      termsError: termsQuery.isError,
    },
    email: {
      value: email,
      checkStatus: emailCheckStatus,
      message: emailMessage,
      isChecking: isEmailChecking,
      onChange: handleEmailChange,
      duplicateCheck: () => {
        void handleEmailDuplicateCheck()
      },
      continue: handleEmailNext,
    },
    password: {
      password,
      setPassword,
      confirm: passwordConfirm,
      setConfirm: setPasswordConfirm,
      isMismatch: passwordDerived.isMismatch,
      isValid: passwordDerived.isValid,
      continue: handlePasswordContinue,
    },
    profile: {
      schoolStatus,
      setSchoolStatus: handleSchoolStatusChange,
      schoolName,
      setSchoolName: handleSchoolNameChange,
      schoolOrganizationId,
      /** remote API일 때 학교는 검색 선택만 허용 */
      requiresSchoolSearch: remoteApi,
      selectSchool: handleSchoolSelect,
      grade,
      setGrade,
      employmentStatus,
      setEmploymentStatus,
      address,
      setAddress,
      selectAddress: handleAddressSelect,
      addressDetail,
      setAddressDetail,
      postalCode,
      regionSido,
      regionSigungu,
      volunteerId,
      setVolunteerId,
      isAddressModalOpen,
      openAddressModal: () => setIsAddressModalOpen(true),
      closeAddressModal: () => setIsAddressModalOpen(false),
      isSchoolSearchModalOpen,
      openSchoolSearchModal: () => setIsSchoolSearchModalOpen(true),
      closeSchoolSearchModal: () => setIsSchoolSearchModalOpen(false),
      isValid: isStepSixValid,
      continue: handleProfileContinue,
    },
    confirmation: {
      rows: confirmationRows,
      message: submitMessage,
      isSubmitting,
      complete: () => {
        void handleSignupComplete()
      },
    },
    navigation: {
      signIn: handleSignIn,
    },
  }
}
