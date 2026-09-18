import { assignApprovedTrainingNumbers } from './approved-display-numbers'
import type { GeminiApprovedTrainingRow } from './types'

type Listener = () => void

let rows: GeminiApprovedTrainingRow[] = []
const listeners = new Set<Listener>()

function notify(): void {
  listeners.forEach(listener => listener())
}

function setRows(nextRows: GeminiApprovedTrainingRow[]): void {
  rows = assignApprovedTrainingNumbers(nextRows)
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
