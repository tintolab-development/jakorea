/**
 * 회원가입 관련 타입 정의
 * Phase 0.1.2: 회원가입 흐름 (FR-B01, FR-B02)
 * Phase 0.1.3: 소셜 회원가입 지원 추가
 */

import type { ConsentFormData } from './consent'
import type { SocialProvider } from '@/entities/user/api/auth-service'

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
 * 관리자 회원가입 폼 데이터
 * P1: 관리자 회원가입 플로우 추가
 */
export interface AdminRegisterFormData extends BaseRegisterFormData {
  role: 'ADMIN'
  adminLevel: 'ADMIN' | 'GENERAL' // MASTER는 회원가입 불가, 승인 필요
}

/**
 * 회원가입 요청 데이터
 */
export type RegisterFormData =
  | IndividualRegisterFormData
  | SchoolRegisterFormData
  | InstructorRegisterFormData
  | AdminRegisterFormData

/**
 * 회원가입 요청 (동의 포함)
 * Phase 0.1.3 수정: 소셜 제공자 정보 추가
 */
export interface RegisterRequest {
  formData: RegisterFormData
  consent: ConsentFormData
  socialProvider?: SocialProvider // Phase 0.1.3 수정: OAuth 연동 정보
}

/**
 * 회원가입 응답
 */
export interface RegisterResponse {
  success: boolean
  userId: string
  message?: string
}
