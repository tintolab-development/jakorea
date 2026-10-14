import type { ResultListItem } from '../model/types'

export type AdjacentResults = {
  previous: ResultListItem | null
  next: ResultListItem | null
}

export function getEmptyAdjacentResults(): AdjacentResults {
  return { previous: null, next: null }
}
