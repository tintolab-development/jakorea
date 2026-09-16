import type { GeminiRecruitmentAddFormSnapshot } from '../../lib/recruitment/add-local-save'
import { removeGeminiRecruitmentAddDraft } from '../../lib/recruitment/add-local-save'
import { assignRecruitmentDisplayNumbers } from './mock'
import {
  GEMINI_RECRUITMENT_DRAFT_ROW_ID,
  type GeminiRecruitmentRow,
} from './types'

type Listener = () => void

let rows: GeminiRecruitmentRow[] = []
const listeners = new Set<Listener>()

function notify(): void {
  listeners.forEach(listener => listener())
}

function setRows(nextRows: GeminiRecruitmentRow[]): void {
  rows = assignRecruitmentDisplayNumbers(nextRows)
  notify()
}

function snapshotToRow(
  snapshot: GeminiRecruitmentAddFormSnapshot,
  id: string,
  isDraft: boolean
): GeminiRecruitmentRow {
  return {
    id,
    displayNo: 0,
    title: snapshot.title.trim() || '(제목 없음)',
    applicationPeriodStart: snapshot.applicationPeriodStart ?? '',
    applicationPeriodEnd: snapshot.applicationPeriodEnd ?? '',
    trainingRequestPeriodStart: snapshot.trainingRequestPeriodStart ?? '',
    trainingRequestPeriodEnd: snapshot.trainingRequestPeriodEnd ?? '',
    isDraft,
  }
}

export function subscribeGeminiRecruitmentRows(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getGeminiRecruitmentRowsSnapshot(): GeminiRecruitmentRow[] {
  return rows
}

export function deleteGeminiRecruitmentRows(ids: string[]): void {
  const idSet = new Set(ids)
  if (idSet.has(GEMINI_RECRUITMENT_DRAFT_ROW_ID)) {
    removeGeminiRecruitmentAddDraft()
  }
  setRows(rows.filter(row => !idSet.has(row.id)))
}

export function registerGeminiRecruitmentFromSnapshot(
  snapshot: GeminiRecruitmentAddFormSnapshot
): GeminiRecruitmentRow {
  const newRow = snapshotToRow(snapshot, `gvt-recruitment-${Date.now()}`, false)
  const withoutDraft = rows.filter(row => row.id !== GEMINI_RECRUITMENT_DRAFT_ROW_ID)
  setRows([newRow, ...withoutDraft])
  removeGeminiRecruitmentAddDraft()
  return newRow
}
