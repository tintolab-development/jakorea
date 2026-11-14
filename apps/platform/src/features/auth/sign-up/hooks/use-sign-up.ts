import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { IDENTITY_EXPECTED_PROFILE_MISMATCH } from '@jakorea/identity-verification'
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
  schoolGradeOptions,
  SIGN_IN_PATH,
  SIGN_UP_COMPLETE_PATH,
  SIGN_UP_TOTAL_STEPS,
  SIGN_UP_UNDER_AGE_TOTAL_STEPS,
} from '../lib/constants'
import {
  getSchoolGradeOptions,
  isGradeInSchoolLevel,
  type SchoolLevel,
} from '../lib/school-grade'
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
  getBirthDateRangeMessage,
  resolveSubmittedSchoolStatus,
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
  isMockAdminRegisteredIdentityMatch,
  setAdminRegisteredPasswordChangeRequired,
  startAdminRegisteredFlowFromSignUp,
} from '@/features/auth/admin-registered'
import { getPasswordDerived } from '../lib/password/password.logic'
import {
  hasValidSchoolReference,
  isMinorMemberNameValid,
  isProfileStepValid,
} from '../lib/profile/profile.logic'
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
import { SCHOOL_SELECTION_INCOMPLETE_MESSAGE } from '../ui/school-search-modal/map-selected-school'
import {
  getEmailAvailability,
  postGeneralSignup,
  postSignupIdentityPrecheck,
  postTeacherSignup,
  useSignupTermsQuery,
} from '../api'
import {
  getGuardianSignupStatus,
  pollGuardianSignupStatus,
  postGuardianChallenge,
  postGuardianConsent,
  postGuardianFinalConsentChallenge,
  postSignupIntent,
} from '../api/guardian-signup-bridge/client'
import {
  completeGuardianAfterNice,
  GUARDIAN_RELATION_INVALID_CODE,
} from '../lib/guardian/complete-guardian-after-nice'
import { classifyGuardianSignupStatus } from '../lib/guardian/guardian-bridge-status'
import type { GuardianSignupStatusResponse } from '../api/guardian-signup-bridge/types'
import { resolveGuardianBridgeError } from '../lib/guardian/guardian-bridge-errors'
import { resolveGuardianConsentVersion } from '../lib/guardian/resolve-guardian-consent-version'
import { toSignupIntentGender } from '../lib/guardian/to-signup-intent-gender'
import {
  clearGuardianSignupBridgeState,
  readGuardianFinalConsentChallenge,
  readGuardianSignupBridgeState,
  writeGuardianFinalConsentChallenge,
  writeGuardianSignupBridgeState,
} from '../lib/guardian-signup-bridge-storage'
import {
  mapSignUpToGeneralRequest,
  mapSignUpToTeacherRequest,
  toApiBirthDate,
  toApiMemberType,
} from '../model/mapper'
import {
  hasRequiredVerificationSessions,
  resolveUnderAgeSignupSessions,
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
import {
  getSignupApiErrorMessage,
  readSignupApiErrorDetail,
  resolveSignupSubmitError,
  type SignupFieldErrorKey,
  type SignupSubmitErrorResolution,
} from '../lib/helpers'
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
  /** [가입 완료하기] 중복 제출 방지 — state 반영 전 연속 클릭도 막는다 */
  const signupSubmitInFlightRef = useRef(false)
  /** 본인인증 직후 이미 가입된 회원인지 확인 중 */
  const [isCheckingDuplicateMember, setIsCheckingDuplicateMember] = useState(false)
  /** 시안 「중복 가입 시」(14502-51088) 팝업 */
  const [isDuplicateMemberNoticeOpen, setIsDuplicateMemberNoticeOpen] = useState(false)
  const guardianFinalConsentInFlightRef = useRef(false)
  const guardianFinalConsentDoneRef = useRef(false)
  /** 보호자 NICE 직후 상태 조회 중복 방지 */
  const guardianIdentityInFlightRef = useRef(false)
  /** 새로고침 뒤 보호자 이름·휴대폰을 signup-status로 다시 받을 때 중복 호출 방지 */
  const guardianProfileRestoreSessionRef = useRef<number | null>(null)

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
  const [isGuardianAgreementCompleted, setIsGuardianAgreementCompleted] = useState(() => {
    const phase = parseSignUpPhase(searchParams)
    return phase === 'guardian-profile' || phase === 'guardian-identity'
  })
  // 보호자 흐름(Figma 2750-73961): 약관 동의 → 보호자 본인인증 → 보호자 정보 확인(관계 입력)·최종 동의
  const [isGuardianIdentityVerified, setIsGuardianIdentityVerified] = useState(
    () => parseSignUpPhase(searchParams) === 'guardian-profile',
  )
  const [guardianAgreementSubmitting, setGuardianAgreementSubmitting] = useState(false)
  const [guardianAgreementSubmitError, setGuardianAgreementSubmitError] = useState('')
  const [guardianRelationError, setGuardianRelationError] = useState('')
  const [isGuardianFinalConsentCompleted, setIsGuardianFinalConsentCompleted] = useState(
    () => readGuardianSignupBridgeState()?.finalConsentCompleted === true,
  )
  const [signupIntentId, setSignupIntentId] = useState<string | null>(
    () => readGuardianSignupBridgeState()?.signupIntentId ?? null,
  )
  const [guardianProfileSubmitting, setGuardianProfileSubmitting] = useState(false)
  const [guardianProfileSubmitError, setGuardianProfileSubmitError] = useState('')
  const [guardianIdentityErrorMessage, setGuardianIdentityErrorMessage] = useState('')
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
    () => readGuardianSignupBridgeState()?.guardianSessionId ?? null,
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
  // 14세 이상 일반회원의 재학 여부는 기본 미선택(null). 미성년은 생년월일 단계에서 'enrolled'로 둔다.
  const [schoolStatus, setSchoolStatus] = useState<SchoolStatus | null>(null)
  const [schoolName, setSchoolName] = useState('')
  const [schoolAddress, setSchoolAddress] = useState('')
  const [schoolNeisCode, setSchoolNeisCode] = useState<string | null>(null)
  const [schoolEducationOfficeCode, setSchoolEducationOfficeCode] = useState<string | null>(null)
  const [schoolSource, setSchoolSource] = useState<'neis' | 'careerNet' | null>(null)
  const [schoolOrganizationId, setSchoolOrganizationId] = useState<number | null>(null)
  /** 검색으로 고른 학교의 학교급 — 학년 옵션 범위. 모르면 null(기존 1~12학년) */
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel | null>(null)
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
  /** 본인인증부터 다시 진행해야 할 때 본인인증 단계에 보여 줄 서버 message */
  const [identityRestartMessage, setIdentityRestartMessage] = useState('')
  /** 최종 가입 실패 시 입력칸에 붙이는 서버 message (PB2) */
  const [passwordServerError, setPasswordServerError] = useState('')
  const [profileFieldErrors, setProfileFieldErrors] = useState<
    Partial<Record<Extract<SignupFieldErrorKey, 'name' | 'address' | 'grade'>, string>>
  >({})

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

  /** 보호자 이름·휴대폰은 화면 표시용 메모리 값이다 — 저장소·URL·로그에 남기지 않는다 */
  const clearGuardianVerifiedProfile = () => {
    setGuardianVerifiedName('')
    setGuardianVerifiedPhone('')
    guardianProfileRestoreSessionRef.current = null
  }

  const applyGuardianVerifiedStatus = (status: GuardianSignupStatusResponse) => {
    setGuardianVerifiedName(status.verifiedGuardianName?.trim() ?? '')
    setGuardianVerifiedPhone((status.verifiedGuardianPhone ?? '').replace(/\D/g, ''))
    const storedRelation = status.guardianRelation?.trim()
    if (storedRelation) {
      setGuardianRelationship(prev => (prev.trim() ? prev : storedRelation))
    }
  }

  const applyWizardFromUrl = (step: number, phase: SignUpWizardPhase | null) => {
    setCurrentStep(step)

    if (step === 2) {
      setRequiresGuardianConsent(phase === 'guardian-consent')
    }

    if (step === 3) {
      if (isUnderAgeSignupRef.current) {
        if (phase === 'guardian-profile') {
          setIsGuardianAgreementCompleted(true)
          setIsGuardianIdentityVerified(true)
        } else if (phase === 'guardian-identity') {
          setIsGuardianAgreementCompleted(true)
          setIsGuardianIdentityVerified(false)
          clearGuardianVerifiedProfile()
        } else {
          setIsGuardianAgreementCompleted(false)
          setIsGuardianIdentityVerified(false)
          clearGuardianVerifiedProfile()
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
        setIsGuardianFinalConsentCompleted(true)
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
    setIsGuardianFinalConsentCompleted(false)
    guardianFinalConsentInFlightRef.current = false
    guardianFinalConsentDoneRef.current = false
    guardianIdentityInFlightRef.current = false
    guardianProfileRestoreSessionRef.current = null
    setSignupIntentId(null)
    setGuardianProfileSubmitError('')
    setGuardianIdentityErrorMessage('')
    setGuardianAgreementSubmitError('')
    setGuardianRelationError('')
    clearGuardianSignupBridgeState()
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
    setSchoolStatus(null)
    setSchoolName('')
    setSchoolAddress('')
    setSchoolNeisCode(null)
    setSchoolEducationOfficeCode(null)
    setSchoolSource(null)
    setSchoolOrganizationId(null)
    setSchoolLevel(null)
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
    setIdentityRestartMessage('')
    setPasswordServerError('')
    setProfileFieldErrors({})
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

    // 보호자 이름·휴대폰은 보호자 NICE 뒤 signup-status로만 채운다(저장값으로 복원하지 않는다)
    if (bridge.source !== 'guardian' && bridge.verifiedName?.trim()) {
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

  // ④ 새로고침·뒤로가기로 보호자 정보 확인 이후 단계에 오면 이름·휴대폰을 signup-status로 다시 받는다
  useEffect(() => {
    if (!remoteApi || !isUnderAgeSignup || !isGuardianIdentityVerified) return
    if (guardianVerifiedName.trim()) return
    const bridge = readGuardianSignupBridgeState()
    if (!bridge) return
    if (guardianProfileRestoreSessionRef.current === bridge.guardianSessionId) return
    guardianProfileRestoreSessionRef.current = bridge.guardianSessionId

    let cancelled = false
    let settled = false
    void getGuardianSignupStatus({
      guardianSessionId: bridge.guardianSessionId,
      statusToken: bridge.guardianStatusToken,
    })
      .then(status => {
        settled = true
        if (cancelled) return
        if (status.identityVerified === true) {
          applyGuardianVerifiedStatus(status)
          return
        }
        // 보호자 본인인증이 끝나지 않은 세션 — 본인인증 단계로 돌린다
        setIsGuardianIdentityVerified(false)
        if (currentStep === 3) {
          replaceWizard(3, 'guardian-identity')
        }
      })
      .catch(() => {
        settled = true
        if (!cancelled) guardianProfileRestoreSessionRef.current = null
      })
    return () => {
      cancelled = true
      // 응답 전에 조건이 바뀌면 다음 실행에서 다시 조회한다
      if (!settled) guardianProfileRestoreSessionRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 복원 조건이 바뀔 때만 다시 조회
  }, [remoteApi, isUnderAgeSignup, isGuardianIdentityVerified, guardianVerifiedName, currentStep])

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
      ? isTeacherProfileValid(schoolName, employmentStatus, {
          schoolOrganizationId,
          schoolNeisCode,
        })
      : isProfileStepValid(address, addressDetail, schoolStatus, schoolName, grade, {
          schoolOrganizationId,
          schoolNeisCode,
        }) && (!isUnderAgeSignup || isMinorMemberNameValid(memberProfileName))
  // 일반회원은 프로필 단계 필수 검증(isStepSixValid)을 통과해야 확인·제출로 가므로 여기서는 선택값이 있다.
  // 교사회원은 재학 여부를 쓰지 않는다(요청·확인 화면 모두 무시).
  const submittedSchoolStatus = resolveSubmittedSchoolStatus(schoolStatus)
  const isGuardianProfileValidState = isGuardianProfileValid({
    name: guardianVerifiedName,
    phone: guardianVerifiedPhone,
    relationship: guardianRelationship,
  })

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
      // 범위 오류(future·too-old)는 입력 중 생년월일 입력란 아래에 이미 보인다
      setStepTwoMessage(result.reason === 'format' ? result.message : '')
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

  const resetGuardianBridgeSession = () => {
    guardianFinalConsentInFlightRef.current = false
    guardianFinalConsentDoneRef.current = false
    guardianIdentityInFlightRef.current = false
    setIsGuardianAgreementCompleted(false)
    setIsGuardianIdentityVerified(false)
    setIsGuardianFinalConsentCompleted(false)
    setSignupIntentId(null)
    setGuardianVerificationSessionId(null)
    setGuardianProfileSubmitError('')
    setGuardianIdentityErrorMessage('')
    setGuardianAgreementSubmitError('')
    setGuardianRelationError('')
    clearGuardianSignupBridgeState()
    setGuardianAgreements(createInitialGuardianAgreementState())
    setGuardianRelationship('')
    clearGuardianVerifiedProfile()
  }

  /**
   * 보호자 인증 세션(signupIntent·challenge)을 버리고 약관 동의 단계부터 다시 진행한다.
   * 보호자 약관 체크 상태는 그대로 둔다.
   */
  const restartGuardianSession = (message: string) => {
    guardianFinalConsentInFlightRef.current = false
    guardianFinalConsentDoneRef.current = false
    guardianIdentityInFlightRef.current = false
    setIsGuardianAgreementCompleted(false)
    setIsGuardianIdentityVerified(false)
    setIsGuardianFinalConsentCompleted(false)
    setGuardianVerificationSessionId(null)
    setSignupIntentId(null)
    clearGuardianSignupBridgeState()
    clearGuardianVerifiedProfile()
    setGuardianRelationError('')
    setGuardianProfileSubmitError('')
    setGuardianIdentityErrorMessage('')
    setGuardianAgreementSubmitError(message)
    replaceWizard(3, 'guardian-agreement')
  }

  const handleSwitchToGeneralMember = () => {
    setSelectedType('general')
    setStepTwoMessage('')
    setRequiresGuardianConsent(false)
    resetGuardianBridgeSession()
    // 회원 유형 선택(1단계)으로 돌아가 일반회원이 선택된 상태로 둔다.
    // 교사용 생년월일 화면을 history에서 바꿔, 뒤로가기로 다시 열리지 않게 한다.
    replaceWizard(1)
  }

  const applyPreviousStepProgrammatically = () => {
    if (currentStep === 2 && requiresGuardianConsent) {
      setRequiresGuardianConsent(false)
      replaceWizard(2)
      return
    }

    if (currentStep === 3 && isUnderAgeSignup) {
      // 보호자 정보 확인 → 보호자 본인인증
      if (isGuardianIdentityVerified) {
        setIsGuardianIdentityVerified(false)
        clearGuardianVerifiedProfile()
        setGuardianRelationError('')
        setGuardianProfileSubmitError('')
        replaceWizard(3, 'guardian-identity')
        return
      }

      // 보호자 본인인증 → 약관 동의 (다시 [동의하고 계속하기]를 누르면 새 세션을 만든다)
      if (isGuardianAgreementCompleted) {
        setIsGuardianAgreementCompleted(false)
        setGuardianVerificationSessionId(null)
        setSignupIntentId(null)
        clearGuardianSignupBridgeState()
        setGuardianIdentityErrorMessage('')
        replaceWizard(3, 'guardian-agreement')
        return
      }

      setRequiresGuardianConsent(true)
      replaceWizard(2, 'guardian-consent')
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
        phase = isUnderAgeSignup ? 'guardian-profile' : 'agreement'
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
      memberType: apiMemberType ?? undefined,
      birthDateIso: birthDateIso ?? undefined,
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

  /**
   * ① 보호자 챌린지(이름·휴대폰·관계 없이) → ② 약관 동의 `{ agreed, termsVersion }` → 보호자 본인인증 단계
   */
  const handleGuardianAgreementContinue = async () => {
    if (!guardianAgreementDerived.isRequiredAgreed || guardianAgreementSubmitting) return

    if (!remoteApi) {
      setGuardianAgreementSubmitError('보호자 인증 API 연동 후 진행할 수 있습니다.')
      return
    }

    setGuardianAgreementSubmitError('')
    setGuardianAgreementSubmitting(true)

    try {
      const apiBirth = toApiBirthDate(signupMemberBirthDate)
      const intentGender = toSignupIntentGender(gender)
      if (!apiBirth || !intentGender) {
        setGuardianAgreementSubmitError('가입자 생년월일과 성별을 step 2에서 다시 확인해 주세요.')
        return
      }

      const termsVersion = resolveGuardianConsentVersion(termsQuery.data ?? null)
      if (!termsVersion) {
        setGuardianAgreementSubmitError('약관 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }

      const intent = await postSignupIntent({
        memberType: 'GENERAL',
        birthDate: apiBirth,
        gender: intentGender,
      })
      const intentId = intent.intentId?.trim()
      if (!intentId) {
        setGuardianAgreementSubmitError('가입 준비 정보를 발급하지 못했습니다.')
        return
      }

      const challenge = await postGuardianChallenge({
        provider: 'NICE',
        signupIntentId: intentId,
      })

      const guardianSessionId = challenge.sessionId
      const statusToken = challenge.statusToken?.trim()
      if (guardianSessionId == null || !statusToken) {
        setGuardianAgreementSubmitError('보호자 인증 세션을 생성하지 못했습니다.')
        return
      }

      clearGuardianSignupBridgeState()
      writeGuardianSignupBridgeState({
        signupIntentId: intentId,
        intentExpiresAt: intent.expiresAt,
        guardianSessionId,
        guardianStatusToken: statusToken,
        guardianExpiresAt: challenge.expiresAt,
        guardianConsentVersion: termsVersion,
      })

      setSignupIntentId(intentId)
      setGuardianVerificationSessionId(guardianSessionId)

      await postGuardianConsent({
        guardianSessionId,
        statusToken,
        body: {
          agreed: true,
          termsVersion,
        },
        idempotencyKey: `guardian-first-${intentId}`,
      })

      guardianFinalConsentInFlightRef.current = false
      guardianFinalConsentDoneRef.current = false
      guardianIdentityInFlightRef.current = false
      dismissPortraitConsentRestore()
      setIsGuardianAgreementCompleted(true)
      setIsGuardianIdentityVerified(false)
      setIsGuardianFinalConsentCompleted(false)
      clearGuardianVerifiedProfile()
      setGuardianIdentityErrorMessage('')
      pushWizard(3, 'guardian-identity')
    } catch (error) {
      const resolved = resolveGuardianBridgeError(error)
      if (resolved.action === 'restart_profile' || resolved.action === 'restart_intent') {
        restartGuardianSession(resolved.message)
        return
      }
      setGuardianAgreementSubmitError(resolved.message)
    } finally {
      setGuardianAgreementSubmitting(false)
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
    async (result: IdentityChallengeCompleteResult) => {
      if (isUnderAgeSignupRef.current || readMinorMemberBirthDate() != null) {
        return
      }

      setIdentityRestartMessage('')

      // 본인인증 직후 사전 검사(세션을 소비하지 않음).
      // 관리자 등록 회원 → 「관리자 등록 회원 안내」, 이미 가입 → 「중복 가입 시」 팝업, 둘 다 아니면 계속.
      // 400·401은 본인인증부터 다시, 그 밖의 오류(429 포함)는 기존처럼 서버 message를 보여 준다.
      // 응답 본문이 없는 오류(네트워크 등)는 가입을 막지 않고 최종 가입 요청에서 중복을 막는다.
      const profileToken = result.profileToken?.trim()
      if (remoteApi && profileToken) {
        setIsCheckingDuplicateMember(true)
        try {
          const precheck = await postSignupIdentityPrecheck({
            identityVerificationSessionId: result.sessionId,
            profileToken,
          })
          if (precheck.registeredByAdmin) {
            navigate(ADMIN_REGISTERED_NOTICE_PATH, {
              state: { adminRegisteredEntry: 'sign-up' },
            })
            return
          }
          if (precheck.alreadyRegistered) {
            setIsDuplicateMemberNoticeOpen(true)
            return
          }
        } catch (error) {
          const detail = readSignupApiErrorDetail(error)
          // 400·401: 이번 인증 결과로는 진행할 수 없으니 본인인증 단계에 머물러 다시 인증받는다.
          // 429 등 코드가 있는 오류: 공통 처리처럼 서버 message를 보여 주고 멈춘다.
          if (detail?.httpStatus === 400 || detail?.httpStatus === 401 || detail?.code) {
            setIdentityRestartMessage(
              getSignupApiErrorMessage(error, SIGNUP_IDENTITY_REQUIRED_MESSAGE),
            )
            return
          }
          // 응답 본문 없는 오류 — 가입 흐름을 막지 않는다
        } finally {
          setIsCheckingDuplicateMember(false)
        }
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
    errorCode: memberIdentityErrorCode,
    resetError: resetMemberIdentityError,
  } = useSignupIdentityVerification({
    birthDate,
    gender,
    onSuccess: handleIdentitySuccess,
  })

  /**
   * ③ 보호자 NICE 완료 → ④ signup-status로 이름·휴대폰을 받아 보호자 정보 확인 단계로 간다.
   */
  const handleGuardianIdentitySuccess = async (_result: { identitySessionId: number }) => {
    if (guardianIdentityInFlightRef.current) {
      return
    }
    setGuardianIdentityErrorMessage('')
    const bridge = readGuardianSignupBridgeState()
    if (!bridge) {
      setGuardianIdentityErrorMessage('보호자 인증 정보가 없습니다. 이전 단계부터 다시 진행해 주세요.')
      return
    }

    guardianIdentityInFlightRef.current = true
    try {
      const status = await pollGuardianSignupStatus({
        guardianSessionId: bridge.guardianSessionId,
        statusToken: bridge.guardianStatusToken,
      })
      if (status?.identityVerified !== true) {
        setGuardianIdentityErrorMessage('본인인증이 완료되지 않았습니다. 다시 시도해 주세요.')
        return
      }

      guardianProfileRestoreSessionRef.current = bridge.guardianSessionId
      applyGuardianVerifiedStatus(status)
      setIsGuardianIdentityVerified(true)

      // 이미 최종 동의까지 끝난 세션(새로고침 등)이면 다음 단계로 간다
      if (classifyGuardianSignupStatus(status) === 'consented' && status.guardianRelation?.trim()) {
        guardianFinalConsentDoneRef.current = true
        writeGuardianSignupBridgeState({ ...bridge, finalConsentCompleted: true })
        setIsGuardianFinalConsentCompleted(true)
        pushWizard(4)
        return
      }

      pushWizard(3, 'guardian-profile')
    } catch (error) {
      const resolved = resolveGuardianBridgeError(error)
      if (resolved.action === 'restart_profile' || resolved.action === 'restart_intent') {
        restartGuardianSession(resolved.message)
        return
      }
      setGuardianIdentityErrorMessage(resolved.message)
    } finally {
      guardianIdentityInFlightRef.current = false
    }
  }

  /**
   * ⑤ 관계 입력 후 최종 동의: final-consent-challenge → consent `{ agreed, termsVersion, guardianRelation, finalConsentToken }`
   */
  const handleGuardianProfileSubmit = async () => {
    if (!isGuardianProfileValidState || guardianProfileSubmitting) return

    if (!remoteApi) {
      setGuardianProfileSubmitError('보호자 인증 API 연동 후 진행할 수 있습니다.')
      return
    }

    if (guardianFinalConsentInFlightRef.current) {
      return
    }
    // 최종 동의를 마친 뒤 뒤로 왔다가 다시 누르면 다음 단계로만 간다
    if (guardianFinalConsentDoneRef.current) {
      pushWizard(4)
      return
    }

    const bridge = readGuardianSignupBridgeState()
    if (!bridge) {
      restartGuardianSession('보호자 인증 정보가 없습니다. 이전 단계부터 다시 진행해 주세요.')
      return
    }

    guardianFinalConsentInFlightRef.current = true
    setGuardianProfileSubmitError('')
    setGuardianRelationError('')
    setGuardianProfileSubmitting(true)

    const termsVersion =
      bridge.guardianConsentVersion ??
      resolveGuardianConsentVersion(termsQuery.data ?? null)
    const guardianRelation = guardianRelationship.trim()

    try {
      const result = await completeGuardianAfterNice({
        termsVersion: termsVersion ?? '',
        guardianRelation,
        client: {
          getStatus: () =>
            pollGuardianSignupStatus({
              guardianSessionId: bridge.guardianSessionId,
              statusToken: bridge.guardianStatusToken,
            }),
          issueFinalConsentChallenge: () =>
            postGuardianFinalConsentChallenge({
              guardianSessionId: bridge.guardianSessionId,
              statusToken: bridge.guardianStatusToken,
            }),
          postFinalConsent: ({ finalConsentToken, idempotencyKey }) =>
            postGuardianConsent({
              guardianSessionId: bridge.guardianSessionId,
              statusToken: bridge.guardianStatusToken,
              body: {
                agreed: true,
                termsVersion: termsVersion ?? '',
                guardianRelation,
                finalConsentToken,
              },
              idempotencyKey,
            }),
          readStoredChallenge: () => readGuardianFinalConsentChallenge(),
          persistChallenge: writeGuardianFinalConsentChallenge,
          createIdempotencyKey: () =>
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
              ? crypto.randomUUID()
              : `guardian-final-${Date.now()}`,
        },
      })

      if (result.kind === 'error') {
        guardianFinalConsentInFlightRef.current = false
        if (result.code === GUARDIAN_RELATION_INVALID_CODE) {
          setGuardianRelationError(result.message)
          return
        }
        if (result.action === 'restart_profile' || result.action === 'restart_intent') {
          restartGuardianSession(result.message)
          return
        }
        setGuardianProfileSubmitError(result.message)
        return
      }

      guardianFinalConsentDoneRef.current = true
      guardianFinalConsentInFlightRef.current = false
      const minorBirth = readMinorMemberBirthDate()
      if (minorBirth) {
        setBirthDate(minorBirth)
      }
      writeGuardianSignupBridgeState({
        ...bridge,
        finalConsentCompleted: true,
      })
      setIsGuardianFinalConsentCompleted(true)
      pushWizard(4)
    } catch {
      guardianFinalConsentInFlightRef.current = false
      setGuardianProfileSubmitError('보호자 동의를 완료하지 못했습니다. 다시 시도해 주세요.')
    } finally {
      setGuardianProfileSubmitting(false)
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
      pushWizard(5)
    }
  }

  const handleSchoolStatusChange = (status: SchoolStatus) => {
    setSchoolStatus(status)

    if (status === 'none') {
      setSchoolName('')
      setSchoolAddress('')
      setSchoolNeisCode(null)
      setSchoolEducationOfficeCode(null)
      setSchoolSource(null)
      setSchoolOrganizationId(null)
      setSchoolLevel(null)
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
    setSchoolLevel(null)
  }

  const handleSchoolSelect = (school: SelectedSchool) => {
    const nextSchoolLevel = school.schoolLevel ?? null
    setSchoolLevel(nextSchoolLevel)
    // 학교를 바꿔 이미 고른 학년이 새 학교급 범위 밖이면 학년 선택을 비운다
    if (!isGradeInSchoolLevel(grade, nextSchoolLevel, schoolGradeOptions)) {
      setGrade('')
    }
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

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setPasswordServerError('')
  }

  const handleGradeChange = (value: string) => {
    setGrade(value)
    setProfileFieldErrors(prev => ({ ...prev, grade: undefined }))
  }

  const handleMemberNameChange = (value: string) => {
    setMemberProfileName(value)
    setProfileFieldErrors(prev => ({ ...prev, name: undefined }))
  }

  const handleGuardianRelationshipChange = (value: string) => {
    setGuardianRelationship(value)
    setGuardianRelationError('')
  }

  const handleAddressSelect = (selection: SelectedAddress) => {
    setProfileFieldErrors(prev => ({ ...prev, address: undefined }))
    setAddress(selection.address)
    setPostalCode(selection.postalCode ?? '')
    setRegionSido(selection.regionSido ?? '')
    setRegionSigungu(selection.regionSigungu ?? '')
  }

  const handlePasswordContinue = () => {
    pushWizard(6)
  }

  const handleProfileContinue = () => {
    pushWizard(7)
  }

  const handleBirthDateChange = (value: string) => {
    setBirthDate(formatBirthDateInput(value))
    clearMinorMemberBirthDate()
    writeSignupWizardFields({ under14Flow: false })
    setStepTwoMessage('')
    setRequiresGuardianConsent(false)
    setIsGuardianAgreementCompleted(false)
    setIsGuardianIdentityVerified(false)
    setIsGuardianFinalConsentCompleted(false)
    guardianFinalConsentInFlightRef.current = false
    guardianFinalConsentDoneRef.current = false
    guardianIdentityInFlightRef.current = false
    setSignupIntentId(null)
    clearGuardianSignupBridgeState()
    setGuardianAgreements(createInitialGuardianAgreementState())
    setGuardianRelationship('')
    clearGuardianVerifiedProfile()
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
    setIsGuardianFinalConsentCompleted(false)
    guardianFinalConsentInFlightRef.current = false
    guardianFinalConsentDoneRef.current = false
    guardianIdentityInFlightRef.current = false
    setSignupIntentId(null)
    clearGuardianSignupBridgeState()
    setGuardianAgreements(createInitialGuardianAgreementState())
    setGuardianRelationship('')
    setGuardianAgreementSubmitError('')
    setGuardianRelationError('')
    setGuardianVerificationSessionId(null)
    clearGuardianVerifiedProfile()
    setVerifiedName('')
    setVerifiedPhone('')
    clearSignupMemberVerifiedIdentity()
    pushWizard(3, 'guardian-agreement')
  }

  const handleSignupComplete = async () => {
    if (signupSubmitInFlightRef.current) return
    signupSubmitInFlightRef.current = true
    // 교사회원 학교 기관 ID 조회(resolvePortalSchoolOrganizationId)보다 먼저 제출 중으로 둔다
    setIsSubmitting(true)

    try {
      await submitSignup()
    } finally {
      signupSubmitInFlightRef.current = false
      setIsSubmitting(false)
    }
  }

  /**
   * 가입 제출 본문. 에러 문구는 클릭 즉시 지우지 않고,
   * 새 결과(성공 또는 새 실패)가 확정될 때 바꾼다.
   */
  const submitSignup = async () => {
    if (!remoteApi) {
      setSubmitMessage('')
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

    const guardianBridge = readGuardianSignupBridgeState()
    const underAgeSessions = resolveUnderAgeSignupSessions({
      signupIntentId,
      guardianVerificationSessionId,
      guardianBridgeFinalConsentCompleted: isGuardianFinalConsentCompleted,
      persisted: guardianBridge,
      wizardStep: currentStep,
    })
    const underAgeSignup =
      isUnderAgeSignup ||
      readSignupWizardFields()?.under14Flow === true ||
      guardianBridge != null

    if (
      !hasRequiredVerificationSessions({
        isUnderAgeSignup: underAgeSignup,
        identityVerificationSessionId,
        guardianVerificationSessionId: underAgeSessions.guardianVerificationSessionId,
        signupIntentId: underAgeSessions.signupIntentId,
        guardianBridgeFinalConsentCompleted:
          underAgeSessions.guardianBridgeFinalConsentCompleted,
      })
    ) {
      setSubmitMessage(SIGNUP_IDENTITY_REQUIRED_MESSAGE)
      return
    }

    if (selectedType === 'teacher' && !schoolName.trim()) {
      setSubmitMessage('소속 학교를 검색에서 선택해 주세요.')
      return
    }

    if (
      (selectedType === 'teacher' ||
        (selectedType === 'general' && schoolStatus === 'enrolled')) &&
      !hasValidSchoolReference({ schoolOrganizationId, schoolNeisCode })
    ) {
      setSubmitMessage(SCHOOL_SELECTION_INCOMPLETE_MESSAGE)
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
      isUnderAgeSignup: underAgeSignup,
      isIdentityVerified,
      identityVerificationSessionId,
      guardianVerificationSessionId: underAgeSessions.guardianVerificationSessionId,
      signupIntentId: underAgeSessions.signupIntentId,
      schoolStatus: submittedSchoolStatus,
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

      setSubmitMessage('')
      clearPortraitConsentSession()
      navigate(SIGN_UP_COMPLETE_PATH, {
        replace: true,
        state: { memberType: selectedType },
      })
    } catch (error) {
      applySignupSubmitError(
        resolveSignupSubmitError(
          error,
          { memberType: selectedType, isUnderAgeSignup: underAgeSignup },
          '가입에 실패했어요. 입력 정보를 확인한 뒤 다시 시도해 주세요.',
        ),
        underAgeSignup,
      )
    }
  }

  /**
   * 최종 가입 실패 사유별 이동 (PB2·PB3).
   * - 입력칸이 있는 단계: 그 단계로 가서 칸에 서버 message
   * - 본인인증 계열: 본인인증만 초기화하고 본인인증 단계로 (약관·이메일·비밀번호·회원 정보는 유지)
   *   14세 미만은 보호자 인증 세션을 버리고 보호자 약관 동의 단계로 (약관 체크는 유지)
   * - 409 중복 가입: 「중복 가입 시」 팝업
   */
  const applySignupSubmitError = (
    resolution: SignupSubmitErrorResolution,
    underAgeSignup: boolean,
  ) => {
    switch (resolution.kind) {
      case 'confirmation':
        setSubmitMessage(resolution.message)
        return
      case 'duplicate-member':
        setSubmitMessage('')
        setIsDuplicateMemberNoticeOpen(true)
        return
      case 'restart-identity':
        setSubmitMessage('')
        if (underAgeSignup) {
          restartGuardianSession(resolution.message)
          return
        }
        setIsIdentityVerified(false)
        setIdentityVerificationSessionId(null)
        setVerifiedName('')
        setVerifiedPhone('')
        clearSignupMemberVerifiedIdentity()
        setIdentityRestartMessage(resolution.message)
        pushWizard(3, 'identity')
        return
      case 'field': {
        setSubmitMessage('')
        const { field, message, step } = resolution
        if (field === 'email') {
          setEmailCheckStatus('error')
          setEmailMessage(message)
        } else if (field === 'password') {
          setPasswordServerError(message)
        } else if (field === 'birthDate' || field === 'gender') {
          setRequiresGuardianConsent(false)
          setStepTwoMessage(message)
        } else {
          setProfileFieldErrors(prev => ({ ...prev, [field]: message }))
        }
        pushWizard(step)
        return
      }
    }
  }

  const confirmationRows = isUnderAgeSignup
    ? buildUnderAgeConfirmationRows({
        birthDate: signupMemberBirthDate,
        gender,
        schoolStatus: submittedSchoolStatus,
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
        schoolStatus: submittedSchoolStatus,
        address,
        addressDetail,
        email,
        volunteerId,
        name: signupMemberName,
        phone: signupMemberPhone,
        schoolName,
        schoolAddress,
        grade,
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
      /** QA-0220: 작성 중 실시간 — 생년월일 범위 오류(입력란 아래) */
      birthDateError: getBirthDateRangeMessage(birthDate) ?? '',
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
        continue: () => {
          void handleGuardianAgreementContinue()
        },
        isSubmitting: guardianAgreementSubmitting,
        submitError: guardianAgreementSubmitError,
      },
      identity: {
        isVerified: isGuardianIdentityVerified,
        sessionId: guardianVerificationSessionId,
        complete: handleGuardianIdentitySuccess,
        errorMessage: guardianIdentityErrorMessage,
      },
      /** 보호자 NICE로 확인된 이름·휴대폰(읽기 전용) + 관계 입력 */
      profile: {
        name: guardianVerifiedName,
        phone: guardianVerifiedPhone,
        relationship: guardianRelationship,
        setRelationship: handleGuardianRelationshipChange,
        relationshipError: guardianRelationError,
        isValid: isGuardianProfileValidState,
        isSubmitting: guardianProfileSubmitting,
        submitError: guardianProfileSubmitError,
        submit: handleGuardianProfileSubmit,
      },
    },
    identity: {
      isVerified: isIdentityVerified,
      verifiedName,
      verifiedPhone,
      sessionId: identityVerificationSessionId,
      complete: handleIdentitySuccess,
      verify: () => {
        setIdentityRestartMessage('')
        return verifyMemberIdentity()
      },
      isVerifying: isMemberIdentityVerifying || isCheckingDuplicateMember,
      errorMessage: memberIdentityErrorMessage || identityRestartMessage || null,
      /** 이미 가입된 회원 안내 팝업 — [확인]은 닫기, [로그인하기]는 로그인 화면 */
      duplicateMemberNotice: {
        open: isDuplicateMemberNoticeOpen,
        close: () => setIsDuplicateMemberNoticeOpen(false),
        goSignIn: () => {
          setIsDuplicateMemberNoticeOpen(false)
          navigate(SIGN_IN_PATH)
        },
      },
      /** 회원가입은 생년월일·성별만 기대값으로 보내므로, 이 코드는 생년월일·성별 불일치다 */
      isProfileMismatch: memberIdentityErrorCode === IDENTITY_EXPECTED_PROFILE_MISMATCH,
      dismissError: resetMemberIdentityError,
      /** 목업 모드 전용 — 원격 모드는 본인인증 뒤 identity-precheck로 판단한다 */
      tryAdminRegisteredRedirect: () => {
        if (!remoteApi && isMockAdminRegisteredIdentityMatch(birthDate)) {
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
      setPassword: handlePasswordChange,
      serverError: passwordServerError,
      confirm: passwordConfirm,
      setConfirm: setPasswordConfirm,
      isMismatch: passwordDerived.isMismatch,
      isPolicyUnmet: passwordDerived.isPolicyUnmet,
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
      setGrade: handleGradeChange,
      /** 고른 학교의 학교급에 맞는 학년 옵션 (학교급을 모르면 1~12학년) */
      gradeOptions: getSchoolGradeOptions(schoolLevel, schoolGradeOptions),
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
      setMemberName: handleMemberNameChange,
      /** 최종 가입 실패로 돌아왔을 때 입력칸에 붙는 서버 message */
      fieldErrors: profileFieldErrors,
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
