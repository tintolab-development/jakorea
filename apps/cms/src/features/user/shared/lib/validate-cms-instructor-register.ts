import { collectInstructorRegisterValidation } from '@jakorea/domain/instructor/validate-register'
import type { InstructorRegisterFormatChecks } from '@jakorea/domain/instructor/validate-register'
import {
  mapInstructorRegisterFormValuesToValidationInput,
  type InstructorRegisterModalFormValues,
} from '@/features/user/shared/ui/instructor-profile-form'

/**
 * CMS 강사 신규 등록 — UI 필수 표시 기준 검증.
 * - 기본 정보: domain 기본 필수
 * - 경력사항: 섹션 `*` — 경력 구분 + (경력) 경력 행
 * - 자유 작성: `required` — 1~4번
 * - 학력·JA·자격·수상·등급: UI 필수 아님
 */
export function collectCmsInstructorRegisterValidation(
  values: InstructorRegisterModalFormValues,
  formatChecks: InstructorRegisterFormatChecks = {}
) {
  return collectInstructorRegisterValidation(
    mapInstructorRegisterFormValuesToValidationInput(values),
    formatChecks,
    {
      requireCareer: true,
      requireFreeWrite: true,
    }
  )
}
