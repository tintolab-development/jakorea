import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import type { ProgramRegistrationParagraphBodyOptions } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'

export function buildProgramRegistrationParagraphBodyOptions(
  options: ProgramRegistrationParagraphBodyOptions
): RenderFormParagraphBodyOptions {
  return {
    programRegistration: options,
  }
}
