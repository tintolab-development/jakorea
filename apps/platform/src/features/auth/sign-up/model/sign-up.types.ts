export type MemberType = 'general' | 'teacher'
export type GenderType = 'male' | 'female'
export type AgreementKey = 'service' | 'privacy' | 'marketing' | 'portrait'
export type EmailCheckStatus = 'idle' | 'success' | 'error'
export type SchoolStatus = 'enrolled' | 'none'
export type SignUpStepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type MemberTypeOption = {
  type: MemberType
  title: string
  primaryDescription: string
  secondaryDescription: string
  imageUrl: string
}

export type AgreementItem = {
  key: AgreementKey
  required: boolean
  label: string
  guide?: string
}

export type ConfirmationRow = {
  label: string
  value: string
}

export type AgreementState = Record<AgreementKey, boolean>

export type GuardianAgreementKey =
  | 'service'
  | 'privacy'
  | 'guardianLegal'
  | 'marketing'
  | 'portrait'

export type GuardianAgreementItem = {
  key: GuardianAgreementKey
  required: boolean
  label: string
  guide?: string
}

export type GuardianAgreementState = Record<GuardianAgreementKey, boolean>

import type { ReactElement } from 'react'
import type { UseSignUpReturn } from '../hooks/use-sign-up'

export type SignUpStepComponent = (props: { signUp: UseSignUpReturn }) => ReactElement
