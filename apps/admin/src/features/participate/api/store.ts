/**
 * 참여하기 메뉴 연결 링크 — localStorage mock
 */

import type { ParticipateMenuLinks } from '@/entities/participate/model/types'
import { PARTICIPATE_LINK_FIXED } from './mappers'

const STORAGE_KEY = 'admin.participate.menuLinks.v1'

export const PARTICIPATE_LINKS_CHANGED_EVENT =
  'jakorea:participate-links-changed' as const

export const DEFAULT_ALUMNI_URL = 'https://gatheralumni.org/'

export const EMPTY_LINK_LABEL = '연결된 링크가 없습니다.'

type StoreFile = {
  version: 1
  data: ParticipateMenuLinks
}

function buildSeed(): ParticipateMenuLinks {
  return {
    onlineLearningId: PARTICIPATE_LINK_FIXED.onlineLearning.id,
    onlineLearningUrl: '',
    onlineLearningVersion: 0,
    alumniId: PARTICIPATE_LINK_FIXED.alumni.id,
    alumniUrl: DEFAULT_ALUMNI_URL,
    alumniVersion: 0,
    updatedAt: '2026-07-01T00:00:00.000Z',
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalize(raw: Partial<ParticipateMenuLinks> | null | undefined): ParticipateMenuLinks {
  const seed = buildSeed()
  if (!raw || typeof raw !== 'object') return seed
  return {
    onlineLearningId: asNumber(raw.onlineLearningId, seed.onlineLearningId),
    onlineLearningUrl: asString(raw.onlineLearningUrl, seed.onlineLearningUrl),
    onlineLearningVersion: asNumber(raw.onlineLearningVersion, seed.onlineLearningVersion),
    alumniId: asNumber(raw.alumniId, seed.alumniId),
    alumniUrl: asString(raw.alumniUrl, seed.alumniUrl),
    alumniVersion: asNumber(raw.alumniVersion, seed.alumniVersion),
    updatedAt: asString(raw.updatedAt, seed.updatedAt),
  }
}

function readFile(): StoreFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 1, data: buildSeed() }
    const parsed = JSON.parse(raw) as StoreFile
    if (parsed?.version !== 1 || !parsed.data) {
      return { version: 1, data: buildSeed() }
    }
    return { version: 1, data: normalize(parsed.data) }
  } catch {
    return { version: 1, data: buildSeed() }
  }
}

function writeFile(file: StoreFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(PARTICIPATE_LINKS_CHANGED_EVENT))
}

export function readParticipateMenuLinks(): ParticipateMenuLinks {
  const file = readFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile(file)
  }
  return file.data
}

export function saveParticipateMenuLinks(data: ParticipateMenuLinks): ParticipateMenuLinks {
  const current = readParticipateMenuLinks()
  const next = normalize({
    ...current,
    onlineLearningUrl: data.onlineLearningUrl.trim(),
    alumniUrl: data.alumniUrl.trim(),
    onlineLearningVersion: data.onlineLearningVersion,
    alumniVersion: data.alumniVersion,
    updatedAt: new Date().toISOString(),
  })
  writeFile({ version: 1, data: next })
  return next
}
