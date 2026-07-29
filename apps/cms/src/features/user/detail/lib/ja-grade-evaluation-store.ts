import { JA_GRADE_EVALUATION_STORAGE_KEY } from '@/features/user/detail/lib/ja-grade-evaluation-constants'

export interface JaGradeEvaluationRecord {
  /** numeric memberId when available; otherwise 0 and `storageKey` is uuid */
  memberId: number
  /** localStorage map key — `String(memberId)` or user uuid */
  storageKey: string
  q1ItemId: string
  q2ItemId: string
  q3ItemId: string
  q4ItemId: string
  comment?: string
  grade: string
  fixedTotal: number
  penalty: number
  totalScore: number
  savedAt: string
}

type JaGradeEvaluationStore = Record<string, JaGradeEvaluationRecord>

function readStore(): JaGradeEvaluationStore {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(JA_GRADE_EVALUATION_STORAGE_KEY)
    if (raw == null || raw === '') return {}
    const parsed = JSON.parse(raw) as JaGradeEvaluationStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStore(store: JaGradeEvaluationStore): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(JA_GRADE_EVALUATION_STORAGE_KEY, JSON.stringify(store))
}

export function resolveJaGradeEvaluationStorageKey(
  memberId: number | null | undefined,
  userId?: string | null
): string | null {
  if (memberId != null) return String(memberId)
  const id = userId?.trim()
  return id ? id : null
}

export function loadJaGradeEvaluationRecord(
  memberIdOrKey: number | string
): JaGradeEvaluationRecord | null {
  const key = String(memberIdOrKey)
  const record = readStore()[key]
  return record ?? null
}

export function saveJaGradeEvaluationRecord(record: JaGradeEvaluationRecord): void {
  const store = readStore()
  const key = record.storageKey || String(record.memberId)
  store[key] = { ...record, storageKey: key }
  writeStore(store)
}
