import { assignDisplayNumbers } from '../../lib/performance/map-upload-to-display-row'
import type {
  GeminiPerformanceImportDuplicateStrategy,
  GeminiPerformanceRow,
} from './types'

type Listener = () => void

let rows: GeminiPerformanceRow[] = []
const listeners = new Set<Listener>()

function notify(): void {
  listeners.forEach(listener => listener())
}

function setRows(nextRows: GeminiPerformanceRow[]): void {
  rows = assignDisplayNumbers(nextRows)
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
