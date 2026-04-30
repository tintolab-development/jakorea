import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/render-form-paragraph-body'
import type { ProgramRegistrationParagraphBodyOptions } from '@/features/template/ui/form-set/program-registration-form/paragraph-body'

export function buildProgramRegistrationParagraphBodyOptions(
  options: ProgramRegistrationParagraphBodyOptions
): RenderFormParagraphBodyOptions {
  return {
    programRegistration: options,
  }
}
