import { collectInstructorRegisterValidation } from '@jakorea/domain/instructor/validate-register'
import type { InstructorRegisterFormatChecks } from '@jakorea/domain/instructor/validate-register'
import { getInstructorRequiredConsentAgreeKeys } from '@jakorea/domain/instructor/form-layout'
import {
  mapInstructorRegisterFormValuesToValidationInput,
  type InstructorRegisterModalFormValues,
} from '@/features/user/shared/ui/instructor-profile-form'

/**
 * CMS 강사 신규 등록 — UI 필수 표시 기준 검증.
 * - 기본 정보: domain 기본 필수
 * - 학력사항: 섹션 `*` — 최종 학력·상태 + 선택한 학력 상세 행
 * - 경력사항: 섹션 `*` — 경력 구분 + (경력) 경력 행
 * - 자유 작성: 선택(비필수)
 * - JA·자격·수상·등급: UI 필수 아님
 */
export function collectCmsInstructorRegisterValidation(
  values: InstructorRegisterModalFormValues,
  formatChecks: InstructorRegisterFormatChecks = {}
) {
  return collectInstructorRegisterValidation(
    mapInstructorRegisterFormValuesToValidationInput(values),
    formatChecks,
    {
      requireEducation: true,
      requireCareer: true,
      requireFreeWrite: false,
      requiredConsentAgreeKeys: [...getInstructorRequiredConsentAgreeKeys('cmsRegister')],
    }
  )
}
