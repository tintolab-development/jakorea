import {
  captureRegistrationWizardFormDraftSnapshot,
  restoreRegistrationWizardFormDraftSnapshot,
} from '@/features/program/general/lib/registration-wizard-form-draft'
import type { WritingFormTemplateSaveRecord } from '@/features/template/lib/writing-form-template-local-save'
import { clearRegistrationWizardSessionDrafts } from '@/features/program/general/lib/registration-wizard-session-drafts'
import {
  clearRegistrationStepTemplateSelections,
  getRegistrationStepTemplateSelections,
} from '@/features/program/shared/lib/step-template-selection'

/**
 * 등록 위저드 한 번 열기.
 * 임시저장 없이 닫으면 방문 중 바뀐 모집·신청 양식 선택과 localStorage 초안을 연 시점으로 되돌린다.
 * 임시저장에 성공하면 그 시점을 새 기준점으로 잡는다.
 */
type RegistrationWizardVisit = {
  generation: number
  closed: boolean
  snapshot: Record<string, WritingFormTemplateSaveRecord>
  stepTemplateSnapshot: string
}

function serializeRegistrationStepTemplateSnapshot(programType: string): string {
  const selections = getRegistrationStepTemplateSelections(programType)
  const sorted = Object.keys(selections)
    .sort()
    .map(key => [key, selections[key]])
  return JSON.stringify(sorted)
}

const visits = new Map<string, RegistrationWizardVisit>()
const pendingEnds = new Map<string, () => void>()
let savesInFlight = 0
let visitEnding = false

export function isRegistrationWizardVisitEnding(): boolean {
  return visitEnding
}

export function beginRegistrationWizardVisit(programType: string): void {
  visitEnding = false
  pendingEnds.delete(programType)
  const previous = visits.get(programType)
  visits.set(programType, {
    generation: (previous?.generation ?? 0) + 1,
    closed: false,
    snapshot: captureRegistrationWizardFormDraftSnapshot(programType),
    stepTemplateSnapshot: serializeRegistrationStepTemplateSnapshot(programType),
  })
}

/** 임시저장이 localStorage에 반영된 뒤 호출한다. 이후 닫기 기준점이 된다. */
export function commitRegistrationWizardVisit(programType: string): void {
  const visit = visits.get(programType)
  if (visit == null) return
  visit.snapshot = captureRegistrationWizardFormDraftSnapshot(programType)
  visit.stepTemplateSnapshot = serializeRegistrationStepTemplateSnapshot(programType)
}

export function isRegistrationWizardVisitDirty(programType: string): boolean {
  const visit = visits.get(programType)
  if (visit == null || visit.closed) return false
  if (
    serializeRegistrationStepTemplateSnapshot(programType) !== visit.stepTemplateSnapshot
  ) {
    return true
  }
  const current = captureRegistrationWizardFormDraftSnapshot(programType)
  return JSON.stringify(current) !== JSON.stringify(visit.snapshot)
}

export async function trackRegistrationWizardVisitSave<T>(
  programType: string,
  work: () => Promise<T>
): Promise<T> {
  savesInFlight += 1
  try {
    const result = await work()
    commitRegistrationWizardVisit(programType)
    return result
  } finally {
    savesInFlight -= 1
    if (savesInFlight === 0) {
      const pending = pendingEnds.get(programType)
      if (pending != null) {
        pendingEnds.delete(programType)
        pending()
      }
    }
  }
}

export function endRegistrationWizardVisit(
  programType: string,
  resetMemory?: () => void
): void {
  const visit = visits.get(programType)
  visitEnding = true
  clearRegistrationWizardSessionDrafts()
  if (visit == null || visit.closed) return

  const generation = visit.generation
  visit.closed = true

  const finish = () => {
    const current = visits.get(programType)
    if (current == null || current.generation !== generation) return
    restoreRegistrationWizardFormDraftSnapshot(programType, current.snapshot)
    visits.delete(programType)
    pendingEnds.delete(programType)
    clearRegistrationStepTemplateSelections(programType)
    resetMemory?.()
  }

  if (savesInFlight > 0) {
    pendingEnds.set(programType, finish)
    return
  }
  finish()
}
