/**
 * 회원가입 관련 타입 정의
 * Phase 0.1.2: 회원가입 흐름 (FR-B01, FR-B02)
 */

import type { ConsentFormData } from './consent'

/**
 * 공통 회원가입 폼 데이터
 */
export interface BaseRegisterFormData {
  email: string
  password: string
  passwordConfirm: string
  name: string
  phone: string
}

/**
 * 개인(참여자) 회원가입 폼 데이터
 */
export interface IndividualRegisterFormData extends BaseRegisterFormData {
  role: 'INDIVIDUAL'
}

/**
 * 학교 회원가입 폼 데이터
 */
export interface SchoolRegisterFormData extends BaseRegisterFormData {
  role: 'SCHOOL'
  schoolName: string
  schoolAddress: string
  position?: string // 담당자 직책
}

/**
 * 강사 회원가입 폼 데이터
 */
export interface InstructorRegisterFormData extends BaseRegisterFormData {
  role: 'INSTRUCTOR'
  bankName: string
  accountNumber: string
  accountHolder: string
  isBusinessIncome: boolean // 사업소득자 여부 (3.3% vs 8.8%)
}

/**
 * 회원가입 요청 데이터
 */
export type RegisterFormData =
  | IndividualRegisterFormData
  | SchoolRegisterFormData
  | InstructorRegisterFormData

/**
 * 회원가입 요청 (동의 포함)
 */
export interface RegisterRequest {
  formData: RegisterFormData
  consent: ConsentFormData
}

/**
 * 회원가입 응답
 */
export interface RegisterResponse {
  success: boolean
  userId: string
  message?: string
}
