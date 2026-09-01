import { assignApprovedTrainingNumbers, createApprovedTrainingMockRows } from './mock'
import type { GeminiApprovedTrainingRow } from './types'

const STORAGE_KEY = 'gemini-approved-training-records'

type Listener = () => void

let rows: GeminiApprovedTrainingRow[] = loadInitialRows()
const listeners = new Set<Listener>()

function loadInitialRows(): GeminiApprovedTrainingRow[] {
  if (typeof window === 'undefined') {
    return createApprovedTrainingMockRows()
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createApprovedTrainingMockRows()
    const parsed = JSON.parse(raw) as GeminiApprovedTrainingRow[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return createApprovedTrainingMockRows()
    }
    return assignApprovedTrainingNumbers(parsed)
  } catch {
    return createApprovedTrainingMockRows()
  }
}

function persist(): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
}

function notify(): void {
  listeners.forEach(listener => listener())
}

function setRows(nextRows: GeminiApprovedTrainingRow[]): void {
  rows = assignApprovedTrainingNumbers(nextRows)
  persist()
  notify()
}

export function subscribeGeminiApprovedTrainingRows(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getGeminiApprovedTrainingRowsSnapshot(): GeminiApprovedTrainingRow[] {
  return rows
}

export function deleteGeminiApprovedTrainingRows(ids: string[]): void {
  const idSet = new Set(ids)
  setRows(rows.filter(row => !idSet.has(row.id)))
}

export function resetGeminiApprovedTrainingRowsToMock(): void {
  setRows(createApprovedTrainingMockRows())
}
