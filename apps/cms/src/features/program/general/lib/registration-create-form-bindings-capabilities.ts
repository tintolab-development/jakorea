import { shouldUseProgramsHttpRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import { shouldUseRemoteApi as shouldUseUjatProgramsRemoteApi } from '@/features/program/ujat/api/capabilities'
import { shouldUseFormsSurveysRemoteApi } from '@/features/template/api/admin-form-templates-service'

/** create 시 programDraftId + formBindings (OpenAPI v9) 경로 */
export function shouldUseRegistrationCreateFormBindings(): boolean {
  return (
    shouldUseFormsSurveysRemoteApi() &&
    (shouldUseProgramsHttpRemoteApi() || shouldUseUjatProgramsRemoteApi())
  )
}

export function assertRegistrationWizardRemoteReady(): void {
  if (shouldUseRegistrationCreateFormBindings()) return
  throw new Error(
    '프로그램 등록은 forms-surveys·programs remote API가 활성화된 환경에서만 이용할 수 있습니다.'
  )
}
