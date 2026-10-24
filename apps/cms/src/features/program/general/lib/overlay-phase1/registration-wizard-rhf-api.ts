/**
 * 일반 등록 위저드 RHF 모듈 sink.
 * FormProvider가 있을 때만 활성. economy / TT / 템플릿 편집은 null.
 */
import type { RegistrationWizardUiValues } from './registration-wizard-ui-values'

export type RegistrationWizardRhfSetOptions = {
  shouldDirty?: boolean
}

export type GeneralRegistrationWizardRhfApi = {
  getValues: () => RegistrationWizardUiValues
  getPath: (path: string) => unknown
  setPath: (path: string, value: unknown, options?: RegistrationWizardRhfSetOptions) => void
  reset: (
    values: RegistrationWizardUiValues,
    options?: { keepDirty?: boolean; keepDefaultValues?: boolean }
  ) => void
  applyOverlayRecord: (
    overlay: Record<string, unknown>,
    options?: RegistrationWizardRhfSetOptions
  ) => void
  isDirty: () => boolean
  markBaseline: () => void
}

let api: GeneralRegistrationWizardRhfApi | null = null
const listeners = new Set<() => void>()

export function registerGeneralRegistrationWizardRhf(
  next: GeneralRegistrationWizardRhfApi | null
): void {
  api = next
  notifyGeneralRegistrationWizardRhf()
}

export function peekGeneralRegistrationWizardRhf(): GeneralRegistrationWizardRhfApi | null {
  return api
}

export function isGeneralRegistrationWizardRhfActive(): boolean {
  return api != null
}

export function subscribeGeneralRegistrationWizardRhf(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function notifyGeneralRegistrationWizardRhf(): void {
  listeners.forEach(listener => listener())
}
