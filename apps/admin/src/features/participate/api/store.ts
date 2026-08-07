/**
 * 참여하기 메뉴 연결 링크 — localStorage mock
 */

import type { ParticipateMenuLinks } from '@/entities/participate/model/types'

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
    onlineLearningUrl: '',
    alumniUrl: DEFAULT_ALUMNI_URL,
    updatedAt: '2026-07-01T00:00:00.000Z',
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function normalize(raw: Partial<ParticipateMenuLinks> | null | undefined): ParticipateMenuLinks {
  const seed = buildSeed()
  if (!raw || typeof raw !== 'object') return seed
  return {
    onlineLearningUrl: asString(raw.onlineLearningUrl, seed.onlineLearningUrl),
    alumniUrl: asString(raw.alumniUrl, seed.alumniUrl),
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
  const next = normalize({
    onlineLearningUrl: data.onlineLearningUrl.trim(),
    alumniUrl: data.alumniUrl.trim(),
    updatedAt: new Date().toISOString(),
  })
  writeFile({ version: 1, data: next })
  return next
}
