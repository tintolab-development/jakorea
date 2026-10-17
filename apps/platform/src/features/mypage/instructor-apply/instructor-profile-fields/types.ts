import type { Dispatch, SetStateAction } from 'react'
import type { InstructorSharedProfileFormValues } from '@jakorea/domain/instructor/profile-form-values'

export type InstructorProfileFieldSurface = 'apply' | 'settings'

export type InstructorProfileFieldsProps = {
  values: InstructorSharedProfileFormValues
  onValuesChange: Dispatch<SetStateAction<InstructorSharedProfileFormValues>>
  /** `settings` — 회원정보 설정 인라인 수정 (테이블·카드 배경 없음, 세로 라벨) */
  surface?: InstructorProfileFieldSurface
}
