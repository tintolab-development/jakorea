import type { Program } from '@/types/domain'
import { attachRegistrationFormDraftsToProgram } from '@/features/program/general/lib/sync-registration-form-bindings'

/**
 * @deprecated create 시 `programDraftId` + `formBindings` 사용 (enrich-program-create-request).
 * 레거시 attach — remote create formBindings 미사용 경로에서만 호출.
 */
export async function attachRegistrationFormDraftsAfterProgramCreate(
  program: Program
): Promise<Program> {
  const { shouldUseRegistrationCreateFormBindings } = await import(
    '@/features/program/general/lib/registration-create-form-bindings-capabilities'
  )
  if (shouldUseRegistrationCreateFormBindings()) {
    return program
  }
  try {
    await attachRegistrationFormDraftsToProgram(program)
  } catch (error) {
    console.warn('[program-form-bindings] attach registration form drafts failed', error)
  }
  return program
}
