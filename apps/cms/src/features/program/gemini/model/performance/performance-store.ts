import { assignDisplayNumbers } from '../../lib/performance/map-upload-to-display-row'
import { createPerformanceMockRows } from './mock'
import type {
  GeminiPerformanceImportDuplicateStrategy,
  GeminiPerformanceRow,
} from './types'

const STORAGE_KEY = 'gemini-performance-records'

type Listener = () => void

let rows: GeminiPerformanceRow[] = loadInitialRows()
const listeners = new Set<Listener>()

function loadInitialRows(): GeminiPerformanceRow[] {
  if (typeof window === 'undefined') {
    return createPerformanceMockRows()
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createPerformanceMockRows()
    const parsed = JSON.parse(raw) as GeminiPerformanceRow[]
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return createPerformanceMockRows()
    }
    return assignDisplayNumbers(parsed)
  } catch {
    return createPerformanceMockRows()
  }
}

function persist(): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
}

function notify(): void {
  listeners.forEach(listener => listener())
}

function setRows(nextRows: GeminiPerformanceRow[]): void {
  rows = assignDisplayNumbers(nextRows)
  persist()
  notify()
}

export function subscribeGeminiPerformanceRows(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getGeminiPerformanceRowsSnapshot(): GeminiPerformanceRow[] {
  return rows
}

export function deleteGeminiPerformanceRows(ids: string[]): void {
  const idSet = new Set(ids)
  setRows(rows.filter(row => !idSet.has(row.id)))
}

export function importGeminiPerformanceRows(
  incoming: GeminiPerformanceRow[],
  strategy: GeminiPerformanceImportDuplicateStrategy
): void {
  if (strategy === 'append') {
    setRows([...incoming, ...rows])
    return
  }

  const incomingKeySet = new Set(incoming.map(row => row.duplicateKey))
  const preserved = rows.filter(row => !incomingKeySet.has(row.duplicateKey))
  setRows([...incoming, ...preserved])
}

export function findDuplicateKeys(
  incoming: GeminiPerformanceRow[],
  existing: GeminiPerformanceRow[] = rows
): string[] {
  const existingKeys = new Set(existing.map(row => row.duplicateKey))
  return incoming
    .map(row => row.duplicateKey)
    .filter(key => existingKeys.has(key))
}

export function resetGeminiPerformanceRowsToMock(): void {
  setRows(createPerformanceMockRows())
}
