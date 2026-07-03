import { useState } from 'react'
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
import { buildConfirmationRows } from '../lib/utils'
import {
  agreementItems,
  createInitialAgreementState,
  getAgreementDerived,
  toggleAgreementState,
  toggleAllAgreementState,
} from '../agreement/agreement.logic'
import {
  createInitialGuardianAgreementState,
  getGuardianAgreementDerived,
  guardianAgreementItems,
  toggleAllGuardianAgreementState,
  toggleGuardianAgreementState,
} from '../agreement/guardian-agreement.logic'
import { validateEmailDuplicateCheck } from '../email/email.logic'
import { getPasswordDerived } from '../password/password.logic'
import { isProfileStepValid } from '../profile/profile.logic'
import { isTeacherProfileValid } from '../profile/teacher-profile.logic'
import { isGuardianProfileValid } from '../guardian/guardian-profile.logic'
import { isBirthStepValid, validateBirthStep } from '../identity/identity.logic'

export type UseSignUpReturn = ReturnType<typeof useSignUp>

export function useSignUp() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedType, setSelectedType] = useState<MemberType | null>(null)
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<GenderType | null>(null)
  const [stepTwoMessage, setStepTwoMessage] = useState('')
  const [requiresGuardianConsent, setRequiresGuardianConsent] = useState(false)
  const [isUnderAgeSignup, setIsUnderAgeSignup] = useState(false)
  const [isGuardianAgreementCompleted, setIsGuardianAgreementCompleted] = useState(false)
  const [isGuardianIdentityVerified, setIsGuardianIdentityVerified] = useState(false)
  const [guardianAgreements, setGuardianAgreements] = useState<GuardianAgreementState>(
    createInitialGuardianAgreementState,
  )
  const [guardianRelationship, setGuardianRelationship] = useState('')
  const [isIdentityVerified, setIsIdentityVerified] = useState(false)
  const [agreements, setAgreements] = useState<AgreementState>(createInitialAgreementState)
  const [email, setEmail] = useState('')
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [emailMessage, setEmailMessage] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [schoolStatus, setSchoolStatus] = useState<SchoolStatus>('none')
  const [schoolName, setSchoolName] = useState('')
  const [grade, setGrade] = useState('')
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus | null>('employed')
  const [address, setAddress] = useState('')
  const [addressDetail, setAddressDetail] = useState('')
  const [volunteerId, setVolunteerId] = useState('')
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [isSchoolSearchModalOpen, setIsSchoolSearchModalOpen] = useState(false)

  const agreementDerived = getAgreementDerived(agreements)
  const guardianAgreementDerived = getGuardianAgreementDerived(guardianAgreements)
  const passwordDerived = getPasswordDerived(password, passwordConfirm)
  const isStepTwoValid = isBirthStepValid(birthDate, gender)
  const isStepSixValid =
    selectedType === 'teacher'
      ? isTeacherProfileValid(schoolName, employmentStatus)
      : isProfileStepValid(address, addressDetail, schoolStatus, schoolName, grade)
  const isGuardianProfileValidState = isGuardianProfileValid(guardianRelationship)

  const handleSignIn = () => {
    window.location.assign(SIGN_IN_PATH)
  }

  const handleNextStep = () => {
    if (currentStep === 1 && selectedType) {
      setCurrentStep(2)
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
      return
    }

    setStepTwoMessage('')
    setIsUnderAgeSignup(false)
    setRequiresGuardianConsent(false)
    setCurrentStep(3)
  }

  const handleSwitchToGeneralMember = () => {
    setSelectedType('general')
    setStepTwoMessage('')
    setRequiresGuardianConsent(false)
    setIsUnderAgeSignup(false)
  }

  const handlePreviousStep = () => {
    if (currentStep === 2 && requiresGuardianConsent) {
      setRequiresGuardianConsent(false)
      return
    }

    if (currentStep === 3 && isUnderAgeSignup) {
      if (isGuardianIdentityVerified) {
        setIsGuardianIdentityVerified(false)
        return
      }

      if (isGuardianAgreementCompleted) {
        setIsGuardianAgreementCompleted(false)
        return
      }

      setRequiresGuardianConsent(true)
      setCurrentStep(2)
      return
    }

    if (currentStep === 4 && isUnderAgeSignup) {
      setIsGuardianIdentityVerified(false)
      setCurrentStep(3)
      return
    }

    if (currentStep === 3 && isIdentityVerified) {
      setIsIdentityVerified(false)
      return
    }

    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const toggleAgreement = (key: AgreementKey) => {
    setAgreements(prev => toggleAgreementState(prev, key))
  }

  const toggleAllAgreements = () => {
    setAgreements(toggleAllAgreementState(!agreementDerived.isAllAgreed))
  }

  const toggleGuardianAgreement = (key: GuardianAgreementKey) => {
    setGuardianAgreements(prev => toggleGuardianAgreementState(prev, key))
  }

  const toggleAllGuardianAgreements = () => {
    setGuardianAgreements(toggleAllGuardianAgreementState(!guardianAgreementDerived.isAllAgreed))
  }

  const handleGuardianAgreementContinue = () => {
    if (guardianAgreementDerived.isRequiredAgreed) {
      setIsGuardianAgreementCompleted(true)
    }
  }

  const handleGuardianIdentityVerify = () => {
    setIsGuardianIdentityVerified(true)
    setCurrentStep(4)
  }

  const handleGuardianProfileContinue = () => {
    if (isGuardianProfileValidState) {
      setCurrentStep(5)
    }
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    setEmailCheckStatus('idle')
    setEmailMessage('')
  }

  const handleEmailDuplicateCheck = () => {
    const result = validateEmailDuplicateCheck(email)
    setEmailCheckStatus(result.status)
    setEmailMessage(result.message)
  }

  const handleAgreementContinue = () => {
    if (agreementDerived.isRequiredAgreed) {
      setCurrentStep(4)
    }
  }

  const handleEmailNext = () => {
    if (emailCheckStatus === 'success') {
      setCurrentStep(isUnderAgeSignup ? 6 : 5)
    }
  }

  const handleSchoolStatusChange = (status: SchoolStatus) => {
    setSchoolStatus(status)

    if (status === 'none') {
      setSchoolName('')
      setGrade('')
    }
  }

  const handlePasswordContinue = () => {
    setCurrentStep(isUnderAgeSignup ? 7 : 6)
  }

  const handleProfileContinue = () => {
    setCurrentStep(isUnderAgeSignup ? 8 : 7)
  }

  const handleBirthDateChange = (value: string) => {
    setBirthDate(value)
    setStepTwoMessage('')
    setRequiresGuardianConsent(false)
    setIsUnderAgeSignup(false)
    setIsGuardianAgreementCompleted(false)
    setIsGuardianIdentityVerified(false)
    setGuardianAgreements(createInitialGuardianAgreementState())
    setGuardianRelationship('')
  }

  const handleStartGuardianConsent = () => {
    setRequiresGuardianConsent(false)
    setIsGuardianAgreementCompleted(false)
    setIsGuardianIdentityVerified(false)
    setGuardianAgreements(createInitialGuardianAgreementState())
    setGuardianRelationship('')
    setCurrentStep(3)
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
  })

  return {
    step: {
      current: currentStep,
      total: isUnderAgeSignup ? SIGN_UP_UNDER_AGE_TOTAL_STEPS : SIGN_UP_TOTAL_STEPS,
      goTo: setCurrentStep,
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
        verify: handleGuardianIdentityVerify,
      },
      profile: {
        name: MOCK_VERIFIED_NAME,
        phone: MOCK_VERIFIED_PHONE,
        relationship: guardianRelationship,
        setRelationship: setGuardianRelationship,
        isValid: isGuardianProfileValidState,
        continue: handleGuardianProfileContinue,
      },
    },
    identity: {
      isVerified: isIdentityVerified,
      verify: () => setIsIdentityVerified(true),
      resetVerified: () => setIsIdentityVerified(false),
    },
    agreement: {
      items: agreementItems,
      state: agreements,
      isAllAgreed: agreementDerived.isAllAgreed,
      isRequiredAgreed: agreementDerived.isRequiredAgreed,
      toggle: toggleAgreement,
      toggleAll: toggleAllAgreements,
      continue: handleAgreementContinue,
    },
    email: {
      value: email,
      checkStatus: emailCheckStatus,
      message: emailMessage,
      onChange: handleEmailChange,
      duplicateCheck: handleEmailDuplicateCheck,
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
      setSchoolName,
      grade,
      setGrade,
      employmentStatus,
      setEmploymentStatus,
      address,
      setAddress,
      addressDetail,
      setAddressDetail,
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
      complete: () => window.location.assign(SIGN_UP_COMPLETE_PATH),
    },
    navigation: {
      signIn: handleSignIn,
    },
  }
}
