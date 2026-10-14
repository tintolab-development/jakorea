import { useCallback, useEffect, useRef, useState } from 'react'
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
} from '../lib/constants'
import { signupGenderFromVerifiedIdentity } from '../lib/helpers/verified-identity-gender'
import { isPortraitConsentDraftReadyForSubmit } from '../lib/map-portrait-consent-filled-document'
import { signupBirthDateFromVerified } from '../lib/helpers/verified-birth-date'
import {
  clearSignupMemberVerifiedIdentity,
  readSignupMemberVerifiedIdentity,
  writeSignupMemberVerifiedIdentity,
} from '../lib/signup-verified-identity-storage'
import {
  readSignupWizardFields,
  writeSignupWizardFields,
} from '../lib/signup-wizard-field-storage'
import {
  signupIdentityVerificationClient,
  useSignupIdentityVerification,
  type IdentityChallengeCompleteResult,
} from '@/features/auth/identity-verification'
import { toApiSignupPhone } from '../lib/helpers/to-api-phone'
import {
  buildConfirmationRows,
  buildUnderAgeConfirmationRows,
  formatBirthDateInput,
} from '../lib/utils'
import {
  createInitialAgreementState,
  getAgreementDerived,
  getAgreementItems,
  setAgreementState,
  toggleAgreementState,
  toggleAllRequiredAgreementState,
} from '../lib/agreement/agreement.logic'
import {
  createInitialGuardianAgreementState,
  getGuardianAgreementDerived,
  guardianAgreementItems,
  setGuardianAgreementState,
  toggleAllRequiredGuardianAgreementState,
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
import { isMinorMemberNameValid, isProfileStepValid } from '../lib/profile/profile.logic'
import { isTeacherProfileValid } from '../lib/profile/teacher-profile.logic'
import { isGuardianProfileValid } from '../lib/guardian/guardian-profile.logic'
import {
  isBirthStepValid,
  resolveIsUnderAgeSignup,
  resolveIsUnderAgeSignupFromSearchParams,
  validateBirthStep,
} from '../lib/identity/identity.logic'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { resolvePortalSchoolOrganizationId } from '../lib/resolve-portal-school-organization-id'
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
import {
  resolveMinorMemberBirthDateForSignup,
  resolveSignupMemberBirthDate,
  validateUnderAgeSignupBeforeSubmit,
} from '../model/validation/signup-underage-submit'
import {
  clearMinorMemberBirthDate,
  readMinorMemberBirthDate,
  writeMinorMemberBirthDate,
} from '../lib/signup-minor-birth-storage'
import { getSignupApiErrorMessage } from '../lib/helpers'
import {
  buildSignUpSearch,
  isFreshSignUpWizardEntry,
  isSignUpWizardLocationState,
  isUnderAgeSignUpWizardPhase,
  parseSignUpPhase,
  parseSignUpStep,
  type SignUpWizardPhase,
} from '../lib/wizard-location'
import {
  buildPortraitConsentPath,
  clearPortraitConsentSession,
  consumePortraitConsentBridge,
  ensureSignupWizardInstanceId,
  dismissPortraitConsentRestore,
  readPortraitConsentDraftForSubmit,
  savePortraitConsentBridge,
  type PortraitConsentBridgeSource,
} from '../lib/portrait-consent-bridge'

export type UseSignUpReturn = ReturnType<typeof useSignUp>

export function useSignUp() {
  const remoteApi = isRemoteApiConfigured()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const isUnderAgeSignupRef = useRef(false)
  const skipUrlSyncRef = useRef(false)
  const wizardPathname = location.pathname
  const freshEntryHandledKeyRef = useRef<string | null>(null)
  const pendingWizardFormResetRef = useRef(false)

  const isFreshSignupEntry = isFreshSignUpWizardEntry(
    searchParams,
    location.state,
    SIGN_UP_UNDER_AGE_TOTAL_STEPS,
  )

  if (isFreshSignupEntry && freshEntryHandledKeyRef.current !== location.key) {
    clearPortraitConsentSession()
    ensureSignupWizardInstanceId()
    freshEntryHandledKeyRef.current = location.key
    pendingWizardFormResetRef.current = true
  }

  const initialWizardBirthDate = readSignupWizardFields()?.birthDate ?? ''
  const initialUnderAgeSignup = resolveIsUnderAgeSignupFromSearchParams(
    searchParams,
    initialWizardBirthDate,
  )

  const [currentStep, setCurrentStep] = useState(() =>
    parseSignUpStep(searchParams, SIGN_UP_UNDER_AGE_TOTAL_STEPS)
  )
  const [selectedType, setSelectedType] = useState<MemberType | null>(
    () => readSignupWizardFields()?.selectedType ?? null
  )
  const [birthDate, setBirthDate] = useState(() => readSignupWizardFields()?.birthDate ?? '')
  const [gender, setGender] = useState<GenderType | null>(
    () => readSignupWizardFields()?.gender ?? null
  )
  const [stepTwoMessage, setStepTwoMessage] = useState('')
  const [requiresGuardianConsent, setRequiresGuardianConsent] = useState(
    () => parseSignUpPhase(searchParams) === 'guardian-consent'
  )
  const [isGuardianAgreementCompleted, setIsGuardianAgreementCompleted] = useState(
    () => parseSignUpPhase(searchParams) === 'guardian-identity'
  )
  const [isGuardianIdentityVerified, setIsGuardianIdentityVerified] = useState(false)
  const [guardianVerifiedName, setGuardianVerifiedName] = useState('')
  const [guardianVerifiedPhone, setGuardianVerifiedPhone] = useState('')
  const [guardianAgreements, setGuardianAgreements] = useState<GuardianAgreementState>(
    createInitialGuardianAgreementState
  )
  const [guardianRelationship, setGuardianRelationship] = useState('')
  const initialMemberVerifiedIdentity = initialUnderAgeSignup
    ? null
    : readSignupMemberVerifiedIdentity()
  const [isIdentityVerified, setIsIdentityVerified] = useState(() => {
    if (initialUnderAgeSignup) return false
    return (
      parseSignUpPhase(searchParams) === 'agreement' || initialMemberVerifiedIdentity != null
    )
  })
  const [identityVerificationSessionId, setIdentityVerificationSessionId] = useState<number | null>(
    () => initialMemberVerifiedIdentity?.sessionId ?? null
  )
  const [guardianVerificationSessionId, setGuardianVerificationSessionId] = useState<number | null>(
    null
  )
  const [verifiedName, setVerifiedName] = useState(
    () => initialMemberVerifiedIdentity?.verifiedName ?? ''
  )
  const [verifiedPhone, setVerifiedPhone] = useState(
    () => initialMemberVerifiedIdentity?.verifiedPhone ?? ''
  )
  const [memberProfileName, setMemberProfileName] = useState('')
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
  const [schoolEducationOfficeCode, setSchoolEducationOfficeCode] = useState<string | null>(null)
  const [schoolSource, setSchoolSource] = useState<'neis' | 'careerNet' | null>(null)
  const [schoolOrganizationId, setSchoolOrganizationId] = useState<number | null>(null)
  const [grade, setGrade] = useState('')
  const [affiliationName, setAffiliationName] = useState('')
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

  const wizardPhase = parseSignUpPhase(searchParams)
  const isUnderAgeSignup = resolveIsUnderAgeSignup(wizardPhase, birthDate)

  isUnderAgeSignupRef.current = isUnderAgeSignup

  const totalSteps = isUnderAgeSignup ? SIGN_UP_UNDER_AGE_TOTAL_STEPS : SIGN_UP_TOTAL_STEPS

  const signupMemberBirthDate = resolveSignupMemberBirthDate({
    isUnderAgeSignup,
    birthDate,
  })

  const signupMemberName = isUnderAgeSignup ? memberProfileName : verifiedName
  const signupMemberPhone = isUnderAgeSignup ? '' : verifiedPhone

  const pushWizard = (step: number, phase?: SignUpWizardPhase | null) => {
    skipUrlSyncRef.current = true
    setCurrentStep(step)
    navigate(
      { pathname: wizardPathname, search: `?${buildSignUpSearch(step, phase)}` },
      { replace: false, state: { signupWizard: true } }
    )
  }

  const replaceWizard = (step: number, phase?: SignUpWizardPhase | null) => {
    skipUrlSyncRef.current = true
    setCurrentStep(step)
    navigate(
      { pathname: wizardPathname, search: `?${buildSignUpSearch(step, phase)}` },
      { replace: true, state: { signupWizard: true } }
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
    if (!pendingWizardFormResetRef.current) return
    pendingWizardFormResetRef.current = false
    dismissPortraitConsentRestore()

    setCurrentStep(1)
    setSelectedType(null)
    setBirthDate('')
    setGender(null)
    setStepTwoMessage('')
    setRequiresGuardianConsent(false)
    setIsGuardianAgreementCompleted(false)
    setIsGuardianIdentityVerified(false)
    setGuardianVerifiedName('')
    setGuardianVerifiedPhone('')
    setMemberProfileName('')
    setGuardianAgreements(createInitialGuardianAgreementState())
    setGuardianRelationship('')
    setIsIdentityVerified(false)
    setIdentityVerificationSessionId(null)
    setGuardianVerificationSessionId(null)
    setVerifiedName('')
    setVerifiedPhone('')
    setAgreements(createInitialAgreementState())
    setEmail('')
    setEmailCheckStatus('idle')
    setEmailMessage('')
    setIsEmailChecking(false)
    setPassword('')
    setPasswordConfirm('')
    setSchoolStatus('none')
    setSchoolName('')
    setSchoolAddress('')
    setSchoolNeisCode(null)
    setSchoolEducationOfficeCode(null)
    setSchoolSource(null)
    setSchoolOrganizationId(null)
    setGrade('')
    setAffiliationName('')
    setEmploymentStatus('employed')
    setAddress('')
    setAddressDetail('')
    setPostalCode('')
    setRegionSido('')
    setRegionSigungu('')
    setVolunteerId('')
    setIsAddressModalOpen(false)
    setIsSchoolSearchModalOpen(false)
    setIsSubmitting(false)
    setSubmitMessage('')
  }, [location.key])

  useEffect(() => {
    if (!isUnderAgeSignup) return
    if (!isIdentityVerified && identityVerificationSessionId == null) return
    setIsIdentityVerified(false)
    setIdentityVerificationSessionId(null)
    setVerifiedName('')
    setVerifiedPhone('')
    clearSignupMemberVerifiedIdentity()
  }, [identityVerificationSessionId, isIdentityVerified, isUnderAgeSignup])

  useEffect(() => {
    const minorBirth = isUnderAgeSignup
      ? resolveMinorMemberBirthDateForSignup(birthDate)
      : null
    const birthForStorage = minorBirth ?? birthDate
    writeSignupWizardFields({
      birthDate: birthForStorage,
      gender,
      selectedType,
      ...(minorBirth ? { minorMemberBirthDate: minorBirth, under14Flow: true } : {}),
    })
  }, [birthDate, gender, selectedType, isUnderAgeSignup])

  useEffect(() => {
    if (!isUnderAgeSignup) return
    const minorBirth = resolveMinorMemberBirthDateForSignup(birthDate)
    if (!minorBirth) return
    if (!readMinorMemberBirthDate()) {
      writeMinorMemberBirthDate(minorBirth)
    }
    if (birthDate.trim() !== minorBirth.trim()) {
      setBirthDate(minorBirth)
    }
  }, [birthDate, isUnderAgeSignup])

  useEffect(() => {
    if (isUnderAgeSignup) {
      writeSignupWizardFields({ under14Flow: true })
    }
  }, [isUnderAgeSignup])

  useEffect(() => {
    const bridge = consumePortraitConsentBridge()
    if (bridge == null) return

    if (bridge.agreements != null) {
      setAgreements({
        ...bridge.agreements,
        portrait: bridge.portraitCompleted === true ? true : bridge.agreements.portrait,
      })
    }
    if (bridge.guardianAgreements != null) {
      setGuardianAgreements({
        ...bridge.guardianAgreements,
        portrait: bridge.portraitCompleted === true ? true : bridge.guardianAgreements.portrait,
      })
    }

    const snapshot = readSignupMemberVerifiedIdentity()
    const bridgePhase = parseSignUpPhase(new URLSearchParams(bridge.returnSearch.replace(/^\?/, '')))
    const restoreMemberIdentity =
      bridge.source !== 'guardian' && !isUnderAgeSignUpWizardPhase(bridgePhase)

    if (bridge.source === 'guardian') {
      if (bridge.verifiedName?.trim()) {
        setGuardianVerifiedName(bridge.verifiedName.trim())
      }
    } else if (bridge.verifiedName?.trim()) {
      setVerifiedName(bridge.verifiedName.trim())
    } else if (restoreMemberIdentity && snapshot?.verifiedName) {
      setVerifiedName(snapshot.verifiedName)
    }

    if (restoreMemberIdentity && snapshot?.verifiedPhone) {
      setVerifiedPhone(snapshot.verifiedPhone)
    }
    if (restoreMemberIdentity && snapshot?.sessionId) {
      setIdentityVerificationSessionId(snapshot.sessionId)
      setIsIdentityVerified(true)
    }
    if (restoreMemberIdentity && snapshot?.verifiedGender) {
      const fromVerification = signupGenderFromVerifiedIdentity(snapshot.verifiedGender)
      if (fromVerification) {
        setGender(fromVerification)
      }
    }

    const wizardFields = readSignupWizardFields()
    const minorBirth =
      readMinorMemberBirthDate()?.trim() ||
      wizardFields?.minorMemberBirthDate?.trim() ||
      null
    if (minorBirth) {
      writeMinorMemberBirthDate(minorBirth)
      setBirthDate(minorBirth)
    } else if (wizardFields?.birthDate.trim()) {
      setBirthDate(wizardFields.birthDate)
    }
    if (wizardFields?.gender) {
      setGender(wizardFields.gender)
    }
    if (wizardFields?.selectedType) {
      setSelectedType(wizardFields.selectedType)
    }
  }, [])

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

  const birthDateIso = toApiBirthDate(signupMemberBirthDate) ?? null
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
      : isProfileStepValid(address, addressDetail, schoolStatus, schoolName, grade) &&
        (!isUnderAgeSignup || isMinorMemberNameValid(memberProfileName))
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
      setRequiresGuardianConsent(false)
      setStepTwoMessage(result.message)
      return
    }

    if (result.status === 'under-age') {
      if (selectedType === 'teacher') {
        setStepTwoMessage('교사 회원은 만 14세 이상만 가입할 수 있어요.')
        return
      }

      setStepTwoMessage('')
      setRequiresGuardianConsent(true)
      setSchoolStatus('enrolled')
      signupIdentityVerificationClient.state.clearPendingChallenge()
      writeMinorMemberBirthDate(birthDate)
      writeSignupWizardFields({
        under14Flow: true,
        minorMemberBirthDate: birthDate,
        birthDate,
      })
      pushWizard(2, 'guardian-consent')
      return
    }

    setStepTwoMessage('')
    setRequiresGuardianConsent(false)
    clearMinorMemberBirthDate()
    writeSignupWizardFields({ under14Flow: false })
    pushWizard(3, 'identity')
  }

  const handleSwitchToGeneralMember = () => {
    setSelectedType('general')
    setStepTwoMessage('')
    setRequiresGuardianConsent(false)
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

  const openPortraitConsentForm = (
    source: PortraitConsentBridgeSource,
    nextAgreements: AgreementState,
    nextGuardianAgreements: GuardianAgreementState
  ) => {
    const returnSearch =
      source === 'guardian'
        ? `?${buildSignUpSearch(3, 'guardian-agreement')}`
        : `?${buildSignUpSearch(3, 'agreement')}`

    savePortraitConsentBridge({
      source,
      returnSearch,
      agreements: nextAgreements,
      guardianAgreements: nextGuardianAgreements,
      verifiedName: isUnderAgeSignup ? memberProfileName : verifiedName,
      portraitCompleted: false,
    })
    navigate(buildPortraitConsentPath(returnSearch))
  }

  const toggleAgreement = (key: AgreementKey) => {
    if (key === 'portrait') {
      if (agreements.portrait) {
        setAgreements(prev => setAgreementState(prev, 'portrait', false))
        return
      }
      openPortraitConsentForm('adult', agreements, guardianAgreements)
      return
    }
    setAgreements(prev => toggleAgreementState(prev, key))
  }

  const setAgreement = (key: AgreementKey, agreed: boolean) => {
    setAgreements(prev => setAgreementState(prev, key, agreed))
  }

  const openPortraitConsentView = (source: PortraitConsentBridgeSource) => {
    openPortraitConsentForm(source, agreements, guardianAgreements)
  }

  const toggleAllAgreements = () => {
    setAgreements(prev => toggleAllRequiredAgreementState(prev, visibleAgreementItems))
  }

  const toggleGuardianAgreement = (key: GuardianAgreementKey) => {
    if (key === 'portrait') {
      if (guardianAgreements.portrait) {
        setGuardianAgreements(prev => setGuardianAgreementState(prev, 'portrait', false))
        return
      }
      openPortraitConsentForm('guardian', agreements, guardianAgreements)
      return
    }
    setGuardianAgreements(prev => toggleGuardianAgreementState(prev, key))
  }

  const setGuardianAgreement = (key: GuardianAgreementKey, agreed: boolean) => {
    setGuardianAgreements(prev => setGuardianAgreementState(prev, key, agreed))
  }

  const toggleAllGuardianAgreements = () => {
    setGuardianAgreements(prev => toggleAllRequiredGuardianAgreementState(prev))
  }

  const handleGuardianAgreementContinue = () => {
    if (guardianAgreementDerived.isRequiredAgreed) {
      dismissPortraitConsentRestore()
      setIsGuardianAgreementCompleted(true)
      pushWizard(3, 'guardian-identity')
    }
  }

  const applyVerifiedIdentityFields = (result: {
    verifiedName?: string
    verifiedPhone?: string
    verifiedBirthDate?: string
    verifiedGender?: string
    syncGender?: boolean
  }) => {
    const skipMemberDemographics =
      isUnderAgeSignupRef.current || readMinorMemberBirthDate() != null

    if (result.verifiedName?.trim()) setVerifiedName(result.verifiedName.trim())
    if (result.verifiedPhone?.trim()) {
      setVerifiedPhone(toApiSignupPhone(result.verifiedPhone) ?? result.verifiedPhone.trim())
    }
    if (!skipMemberDemographics) {
      const fromVerifiedBirth = signupBirthDateFromVerified(result.verifiedBirthDate)
      if (fromVerifiedBirth) {
        setBirthDate(fromVerifiedBirth)
      }
      if (result.syncGender) {
        const fromVerification = signupGenderFromVerifiedIdentity(result.verifiedGender)
        if (fromVerification) setGender(fromVerification)
      }
    }
  }

  const persistMemberVerifiedIdentity = (result: IdentityChallengeCompleteResult) => {
    const verifiedNameValue = result.verifiedName?.trim() ?? ''
    const verifiedPhoneValue =
      toApiSignupPhone(result.verifiedPhone) ?? result.verifiedPhone?.trim() ?? ''
    if (!result.sessionId || !verifiedNameValue || !verifiedPhoneValue) {
      return
    }
    writeSignupMemberVerifiedIdentity({
      sessionId: result.sessionId,
      verifiedName: verifiedNameValue,
      verifiedPhone: verifiedPhoneValue,
      verifiedGender: result.verifiedGender,
    })
  }

  const handleIdentitySuccess = useCallback(
    (result: IdentityChallengeCompleteResult) => {
      if (isUnderAgeSignupRef.current || readMinorMemberBirthDate() != null) {
        return
      }
      setIdentityVerificationSessionId(result.sessionId)
      applyVerifiedIdentityFields({ ...result, syncGender: true })
      persistMemberVerifiedIdentity(result)
      setIsIdentityVerified(true)
      pushWizard(3, 'agreement')
    },
    // pushWizard is stable enough for signup wizard navigation
    // eslint-disable-next-line react-hooks/exhaustive-deps -- wizard navigation closure
    []
  )

  const {
    verify: verifyMemberIdentity,
    isVerifying: isMemberIdentityVerifying,
    errorMessage: memberIdentityErrorMessage,
  } = useSignupIdentityVerification({
    birthDate,
    gender,
    onSuccess: handleIdentitySuccess,
  })

  const handleGuardianIdentitySuccess = (result: {
    sessionId: number
    verifiedName?: string
    verifiedPhone?: string
  }) => {
    setGuardianVerificationSessionId(result.sessionId)
    if (result.verifiedName?.trim()) {
      setGuardianVerifiedName(result.verifiedName.trim())
    }
    if (result.verifiedPhone?.trim()) {
      setGuardianVerifiedPhone(
        toApiSignupPhone(result.verifiedPhone) ?? result.verifiedPhone.trim(),
      )
    }
    setIsGuardianIdentityVerified(true)
    const minorBirth = readMinorMemberBirthDate()
    if (minorBirth) {
      setBirthDate(minorBirth)
    }
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
          (available ? '사용할 수 있는 이메일이에요.' : EMAIL_ID_MESSAGES.duplicate)
      )
      if (available) {
        setEmail(normalizeEmailId(normalizedEmail))
      }
    } catch (error) {
      setEmailCheckStatus('error')
      setEmailMessage(
        getSignupApiErrorMessage(error, '이메일 확인에 실패했어요. 잠시 후 다시 시도해 주세요.')
      )
    } finally {
      setIsEmailChecking(false)
    }
  }

  const handleAgreementContinue = () => {
    if (agreementDerived.isRequiredAgreed) {
      dismissPortraitConsentRestore()
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
    } else {
      setAffiliationName('')
    }
  }

  const handleSchoolNameChange = (value: string) => {
    setSchoolName(value)
    setSchoolAddress('')
    setSchoolNeisCode(null)
    setSchoolEducationOfficeCode(null)
    setSchoolSource(null)
    setSchoolOrganizationId(null)
  }

  const handleSchoolSelect = (school: SelectedSchool) => {
    setSchoolName(school.name)
    setSchoolAddress(school.address?.trim() ?? '')
    setSchoolNeisCode(school.neisCode?.trim() || null)
    setSchoolEducationOfficeCode(school.educationOfficeCode?.trim() || null)
    setSchoolSource(school.source ?? (school.neisCode ? 'neis' : null))
    setSchoolOrganizationId(school.organizationId ?? null)

    if (remoteApi && school.organizationId == null && school.name.trim()) {
      void resolvePortalSchoolOrganizationId({
        schoolName: school.name,
        address: school.address,
      }).then(organizationId => {
        if (organizationId != null) {
          setSchoolOrganizationId(organizationId)
        }
      })
    }
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
    clearMinorMemberBirthDate()
    writeSignupWizardFields({ under14Flow: false })
    setStepTwoMessage('')
    setRequiresGuardianConsent(false)
    setIsGuardianAgreementCompleted(false)
    setIsGuardianIdentityVerified(false)
    setGuardianAgreements(createInitialGuardianAgreementState())
    setGuardianRelationship('')
    setGuardianVerifiedName('')
    setGuardianVerifiedPhone('')
    setMemberProfileName('')
    setIsIdentityVerified(false)
    setIdentityVerificationSessionId(null)
    setGuardianVerificationSessionId(null)
    setVerifiedName('')
    setVerifiedPhone('')
    clearSignupMemberVerifiedIdentity()
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
    setGuardianVerifiedName('')
    setGuardianVerifiedPhone('')
    setVerifiedName('')
    setVerifiedPhone('')
    clearSignupMemberVerifiedIdentity()
    pushWizard(3, 'guardian-agreement')
  }

  const handleSignupComplete = async () => {
    setSubmitMessage('')

    if (!remoteApi) {
      clearPortraitConsentSession()
      navigate(SIGN_UP_COMPLETE_PATH, {
        replace: true,
        state: selectedType ? { memberType: selectedType } : undefined,
      })
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

    const portraitAgreed = isUnderAgeSignup
      ? guardianAgreements.portrait
      : agreements.portrait
    const portraitConsentDraft = portraitAgreed ? readPortraitConsentDraftForSubmit() : null
    if (portraitAgreed) {
      if (portraitConsentDraft == null || !isPortraitConsentDraftReadyForSubmit(portraitConsentDraft)) {
        setSubmitMessage('초상권 동의서 작성을 완료해 주세요.')
        return
      }
    }

    if (isUnderAgeSignup) {
      const underAgeValidation = validateUnderAgeSignupBeforeSubmit({
        birthDate: signupMemberBirthDate,
        guardianAgreements,
        agreements,
        termsCatalog: termsQuery.data ?? null,
      })
      if (underAgeValidation) {
        setSubmitMessage(underAgeValidation)
        return
      }
    }

    let teacherSchoolOrganizationId = schoolOrganizationId
    if (
      selectedType === 'teacher' &&
      remoteApi &&
      teacherSchoolOrganizationId == null &&
      schoolName.trim()
    ) {
      teacherSchoolOrganizationId = await resolvePortalSchoolOrganizationId({
        schoolName,
        address: schoolAddress,
      })
      if (teacherSchoolOrganizationId != null) {
        setSchoolOrganizationId(teacherSchoolOrganizationId)
      }
    }

    const mapInput = {
      selectedType,
      email,
      password,
      birthDate: signupMemberBirthDate,
      gender,
      isUnderAgeSignup,
      isIdentityVerified,
      identityVerificationSessionId,
      guardianVerificationSessionId,
      schoolStatus,
      schoolName,
      schoolOrganizationId: teacherSchoolOrganizationId,
      schoolNeisCode,
      schoolEducationOfficeCode,
      schoolAddress,
      schoolSource: schoolSource ?? undefined,
      grade,
      affiliationName,
      employmentStatus,
      address,
      addressDetail,
      postalCode,
      regionSido,
      regionSigungu,
      volunteerId,
      name: signupMemberName,
      phone: signupMemberPhone,
      agreements,
      guardianAgreements,
      termsCatalog: termsQuery.data ?? null,
      portraitConsentDraft,
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

      clearPortraitConsentSession()
      navigate(SIGN_UP_COMPLETE_PATH, {
        replace: true,
        state: { memberType: selectedType },
      })
    } catch (error) {
      setSubmitMessage(
        getSignupApiErrorMessage(
          error,
          '가입에 실패했어요. 입력 정보를 확인한 뒤 다시 시도해 주세요.'
        )
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmationRows = isUnderAgeSignup
    ? buildUnderAgeConfirmationRows({
        birthDate: signupMemberBirthDate,
        gender,
        schoolStatus,
        address,
        addressDetail,
        email,
        volunteerId,
        memberName: signupMemberName,
        schoolName,
        grade,
        affiliationName,
        guardianName: guardianVerifiedName,
        guardianPhone: guardianVerifiedPhone,
        guardianRelationship,
      })
    : buildConfirmationRows({
        selectedType,
        birthDate,
        gender,
        schoolStatus,
        address,
        addressDetail,
        email,
        volunteerId,
        name: signupMemberName,
        phone: signupMemberPhone,
        schoolName,
        schoolAddress,
        affiliationName,
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
        set: setGuardianAgreement,
        toggleAll: toggleAllGuardianAgreements,
        openPortraitConsent: () => openPortraitConsentView('guardian'),
        continue: handleGuardianAgreementContinue,
      },
      identity: {
        isVerified: isGuardianIdentityVerified,
        sessionId: guardianVerificationSessionId,
        complete: handleGuardianIdentitySuccess,
      },
      profile: {
        name: guardianVerifiedName,
        phone: guardianVerifiedPhone,
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
      verify: verifyMemberIdentity,
      isVerifying: isMemberIdentityVerifying,
      errorMessage: memberIdentityErrorMessage,
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
        if (isUnderAgeSignup) return
        setIsIdentityVerified(false)
        setIdentityVerificationSessionId(null)
        setVerifiedName('')
        setVerifiedPhone('')
        clearSignupMemberVerifiedIdentity()
        replaceWizard(3, 'identity')
      },
    },
    agreement: {
      items: visibleAgreementItems,
      state: agreements,
      isAllAgreed: agreementDerived.isAllAgreed,
      isRequiredAgreed: agreementDerived.isRequiredAgreed,
      toggle: toggleAgreement,
      set: setAgreement,
      toggleAll: toggleAllAgreements,
      openPortraitConsent: () => openPortraitConsentView('adult'),
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
      /** remote API일 때 학교는 검색 모달로 선택 */
      requiresSchoolSearch: remoteApi,
      selectSchool: handleSchoolSelect,
      grade,
      setGrade,
      affiliationName,
      setAffiliationName,
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
      memberName: memberProfileName,
      setMemberName: setMemberProfileName,
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
