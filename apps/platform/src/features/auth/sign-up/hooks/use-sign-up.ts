import { useState } from 'react'
import type { AgreementKey, AgreementState, GenderType, MemberType, SchoolStatus } from '../model/sign-up.types'
import {
  memberTypeOptions,
  SIGN_IN_PATH,
  SIGN_UP_COMPLETE_PATH,
  SIGN_UP_TOTAL_STEPS,
} from '../lib/sign-up.constants'
import { buildConfirmationRows } from '../lib/sign-up.utils'
import {
  agreementItems,
  createInitialAgreementState,
  getAgreementDerived,
  toggleAgreementState,
  toggleAllAgreementState,
} from '../agreement/agreement.logic'
import { validateEmailDuplicateCheck } from '../email/email.logic'
import { getPasswordDerived } from '../password/password.logic'
import { isProfileStepValid } from '../profile/profile.logic'
import { isBirthStepValid, validateBirthStep } from '../identity/identity.logic'

export type UseSignUpReturn = ReturnType<typeof useSignUp>

export function useSignUp() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedType, setSelectedType] = useState<MemberType | null>(null)
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<GenderType | null>(null)
  const [stepTwoMessage, setStepTwoMessage] = useState('')
  const [isIdentityVerified, setIsIdentityVerified] = useState(false)
  const [agreements, setAgreements] = useState<AgreementState>(createInitialAgreementState)
  const [email, setEmail] = useState('')
  const [emailCheckStatus, setEmailCheckStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [emailMessage, setEmailMessage] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [schoolStatus, setSchoolStatus] = useState<SchoolStatus>('none')
  const [address, setAddress] = useState('')
  const [addressDetail, setAddressDetail] = useState('')
  const [volunteerId, setVolunteerId] = useState('')
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)

  const agreementDerived = getAgreementDerived(agreements)
  const passwordDerived = getPasswordDerived(password, passwordConfirm)
  const isStepTwoValid = isBirthStepValid(birthDate, gender)
  const isStepSixValid = isProfileStepValid(address, addressDetail)

  const handleSignIn = () => {
    window.location.assign(SIGN_IN_PATH)
  }

  const handleNextStep = () => {
    if (currentStep === 1 && selectedType) {
      setCurrentStep(2)
    }
  }

  const handleStepTwoNext = () => {
    const message = validateBirthStep(birthDate)

    if (message) {
      setStepTwoMessage(message)
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

  const toggleAgreement = (key: AgreementKey) => {
    setAgreements(prev => toggleAgreementState(prev, key))
  }

  const toggleAllAgreements = () => {
    setAgreements(toggleAllAgreementState(!agreementDerived.isAllAgreed))
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
      setCurrentStep(5)
    }
  }

  const handleBirthDateChange = (value: string) => {
    setBirthDate(value)
    setStepTwoMessage('')
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
      total: SIGN_UP_TOTAL_STEPS,
      goTo: setCurrentStep,
      goPrevious: handlePreviousStep,
      goNextFromStep1: handleNextStep,
      goNextFromStep2: handleStepTwoNext,
    },
    memberType: {
      selected: selectedType,
      setSelected: setSelectedType,
      options: memberTypeOptions,
    },
    birth: {
      birthDate,
      setBirthDate: handleBirthDateChange,
      gender,
      setGender,
      message: stepTwoMessage,
      isValid: isStepTwoValid,
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
      continue: () => setCurrentStep(6),
    },
    profile: {
      schoolStatus,
      setSchoolStatus,
      address,
      setAddress,
      addressDetail,
      setAddressDetail,
      volunteerId,
      setVolunteerId,
      isAddressModalOpen,
      openAddressModal: () => setIsAddressModalOpen(true),
      closeAddressModal: () => setIsAddressModalOpen(false),
      isValid: isStepSixValid,
      continue: () => setCurrentStep(7),
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
