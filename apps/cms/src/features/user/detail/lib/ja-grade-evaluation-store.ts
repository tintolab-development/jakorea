import { JA_GRADE_EVALUATION_STORAGE_KEY } from '@/features/user/detail/lib/ja-grade-evaluation-constants'

export interface JaGradeEvaluationRecord {
  memberId: number
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

export function loadJaGradeEvaluationRecord(
  memberId: number
): JaGradeEvaluationRecord | null {
  const record = readStore()[String(memberId)]
  return record ?? null
}

export function saveJaGradeEvaluationRecord(record: JaGradeEvaluationRecord): void {
  const store = readStore()
  store[String(record.memberId)] = record
  writeStore(store)
}
