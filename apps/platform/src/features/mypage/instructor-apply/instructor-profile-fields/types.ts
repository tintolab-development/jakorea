import type { Dispatch, SetStateAction } from 'react'
import type { INSTRUCTOR_FORM_PLACEHOLDERS } from '@jakorea/domain/instructor/form-copy'
import type { InstructorSharedProfileFormValues } from '@jakorea/domain/instructor/profile-form-values'

export type InstructorProfileFieldSurface = 'apply' | 'settings'

/** 화면별 placeholder 덮어쓰기 (미지정 키는 도메인 기본값) */
export type InstructorProfileFieldPlaceholders = Partial<
  Record<keyof typeof INSTRUCTOR_FORM_PLACEHOLDERS, string>
>

export type InstructorProfileFieldsProps = {
  values: InstructorSharedProfileFormValues
  onValuesChange: Dispatch<SetStateAction<InstructorSharedProfileFormValues>>
  /** `settings` — 회원정보 설정 인라인 수정 (테이블·카드 배경 없음, 세로 라벨) */
  surface?: InstructorProfileFieldSurface
  /** 회원정보 설정 — 문장형 placeholder (강사 신청은 미지정) */
  placeholders?: InstructorProfileFieldPlaceholders
}
