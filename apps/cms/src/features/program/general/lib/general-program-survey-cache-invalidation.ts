import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'

/** 설문 바인딩·양식 저장 후 invalidate — 프로그램 PATCH·schedules 쿼리는 포함하지 않는다. */
export function listGeneralProgramSurveyCacheInvalidationQueryKeys(programId: string) {
  return [
    generalProgramQueryKeys.surveys(programId),
    generalProgramQueryKeys.formBindings(programId),
    [...generalProgramQueryKeys.all, 'survey-responses', programId],
    [...generalProgramQueryKeys.all, 'survey-summary', programId],
    [...generalProgramQueryKeys.all, 'survey-display-titles', programId],
  ]
}
