import type { GeminiRecruitmentAddFormSnapshot } from '../../lib/recruitment/add-local-save'
import { removeGeminiRecruitmentAddDraft } from '../../lib/recruitment/add-local-save'
import {
  assignRecruitmentDisplayNumbers,
  createRecruitmentMockRows,
} from './mock'
import {
  GEMINI_RECRUITMENT_DRAFT_ROW_ID,
  type GeminiRecruitmentRow,
} from './types'

const STORAGE_KEY = 'gemini-recruitment-records'

type Listener = () => void

let rows: GeminiRecruitmentRow[] = loadInitialRows()
const listeners = new Set<Listener>()

function loadInitialRows(): GeminiRecruitmentRow[] {
  if (typeof window === 'undefined') {
    return createRecruitmentMockRows()
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createRecruitmentMockRows()
    const parsed = JSON.parse(raw) as GeminiRecruitmentRow[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return createRecruitmentMockRows()
    }
    const withoutFormDraftRows = parsed.filter(
      row => !row.isDraft && row.id !== GEMINI_RECRUITMENT_DRAFT_ROW_ID
    )
    if (withoutFormDraftRows.length === 0) {
      return createRecruitmentMockRows()
    }
    const numbered = assignRecruitmentDisplayNumbers(withoutFormDraftRows)
    if (withoutFormDraftRows.length !== parsed.length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(numbered))
    }
    return numbered
  } catch {
    return createRecruitmentMockRows()
  }
}

function persist(): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
}

function notify(): void {
  listeners.forEach(listener => listener())
}

function setRows(nextRows: GeminiRecruitmentRow[]): void {
  rows = assignRecruitmentDisplayNumbers(nextRows)
  persist()
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

export function resetGeminiRecruitmentRowsToMock(): void {
  setRows(createRecruitmentMockRows())
}
