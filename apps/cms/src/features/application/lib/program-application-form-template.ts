import type { ApplicationFormTemplate } from '@/types/form-template'

/** 프로그램 신청서 커스텀 필드 — remote form binding 연동 전 빈 템플릿 */
export function getProgramApplicationFormTemplate(programId: string): ApplicationFormTemplate {
  return { programId, customFields: [] }
}
