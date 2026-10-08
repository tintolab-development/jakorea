import { stripWritingTemplateCopySuffix } from '@/features/template/lib/form-template-delete-policy'
import type { RegistrationProgramTypeKey } from '@/features/program/shared/lib/registration-draft-notice'

const selectionByProgramType = new Map<string, Record<string, string>>()

export function registrationStepTemplateSelectionKey(
  programType: string,
  stepKey: string
): string {
  if (
    programType === 'UJAT' &&
    (stepKey === 'recruit-volunteer-h1' || stepKey === 'recruit-volunteer-h2')
  ) {
    return 'recruit-volunteer'
  }
  return stepKey
}

export function getRegistrationStepTemplateSelections(
  programType: string
): Record<string, string> {
  return { ...(selectionByProgramType.get(programType) ?? {}) }
}

export function hydrateRegistrationStepTemplateSelections(
  programType: string,
  selected?: Record<string, string> | null
): void {
  if (selected == null || Object.keys(selected).length === 0) {
    selectionByProgramType.delete(programType)
    return
  }
  selectionByProgramType.set(programType, { ...selected })
}

export function clearRegistrationStepTemplateSelections(programType?: string): void {
  if (programType != null) {
    selectionByProgramType.delete(programType)
    return
  }
  selectionByProgramType.clear()
}

export function setRegistrationStepTemplateSelection(
  programType: string,
  stepKey: string,
  templateCode: string
): void {
  const key = registrationStepTemplateSelectionKey(programType, stepKey)
  const current = getRegistrationStepTemplateSelections(programType)
  current[key] = templateCode
  selectionByProgramType.set(programType, current)
}

export function getSelectedOperationalTemplateCode(
  programType: string,
  stepKey: string,
  defaultTemplateCode: string
): string {
  const key = registrationStepTemplateSelectionKey(programType, stepKey)
  const selected = selectionByProgramType.get(programType)?.[key]?.trim()
  if (selected == null || selected === '') return defaultTemplateCode
  return selected
}

export function isDefaultOperationalTemplateSelection(
  selectedCode: string,
  defaultTemplateCode: string
): boolean {
  return (
    stripWritingTemplateCopySuffix(selectedCode) ===
      stripWritingTemplateCopySuffix(defaultTemplateCode) &&
    selectedCode === defaultTemplateCode
  )
}

export function draftProgramTypeForOperationalBindingKind(
  kind: 'GENERAL' | 'COMPANY_SCHOOL' | 'TRAINED_TEACHER' | 'UJAT'
): RegistrationProgramTypeKey {
  if (kind === 'UJAT') return 'UJAT'
  if (kind === 'COMPANY_SCHOOL') return 'COMPANY_SCHOOL'
  if (kind === 'TRAINED_TEACHER') return 'TRAINED_TEACHER'
  return 'GENERAL'
}
