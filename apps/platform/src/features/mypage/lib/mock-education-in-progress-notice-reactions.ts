import { PLATFORM_REACTION_EMOJI_TYPES } from './platform-reaction-emojis'
import type {
  EducationNoticeReactionSummary,
  EducationNoticeReactionUser,
} from '../model/education-in-progress-notice-types'

const REACTION_AUTHORS = ['김OO', '이OO', '박OO', '주OO', '황OO', '최OO', '정OO', '강OO', '윤OO', '장OO']

const NOTICE_IDS_WITH_REACTIONS = ['edu-notice-001', 'edu-notice-002'] as const

function buildSeedUsers(): EducationNoticeReactionUser[] {
  const rows: EducationNoticeReactionUser[] = []
  let seq = 1
  for (const noticeId of NOTICE_IDS_WITH_REACTIONS) {
    for (let index = 0; index < 10; index += 1) {
      rows.push({
        id: `edu-reaction-${String(seq).padStart(3, '0')}`,
        noticeId,
        authorName: REACTION_AUTHORS[index]!,
        emojiType: PLATFORM_REACTION_EMOJI_TYPES[index % PLATFORM_REACTION_EMOJI_TYPES.length]!,
        reactedAt: new Date(Date.parse('2026-01-15T10:00:00') + index * 60 * 60 * 1000).toISOString(),
      })
      seq += 1
    }
  }
  return rows
}

const usersByNoticeId = new Map<string, EducationNoticeReactionUser[]>()

function resetStore() {
  usersByNoticeId.clear()
  for (const row of buildSeedUsers()) {
    const list = usersByNoticeId.get(row.noticeId) ?? []
    list.push(row)
    usersByNoticeId.set(row.noticeId, list)
  }
}

resetStore()

function summarize(users: EducationNoticeReactionUser[]): EducationNoticeReactionSummary[] {
  const counts = new Map<string, number>()
  for (const user of users) {
    counts.set(user.emojiType, (counts.get(user.emojiType) ?? 0) + 1)
  }
  return PLATFORM_REACTION_EMOJI_TYPES.filter(type => counts.has(type)).map(emojiType => ({
    emojiType,
    count: counts.get(emojiType)!,
  }))
}

function sortByRecent(users: EducationNoticeReactionUser[]): EducationNoticeReactionUser[] {
  return [...users].sort((left, right) => {
    const rightTime = Date.parse(right.reactedAt)
    const leftTime = Date.parse(left.reactedAt)
    if (Number.isNaN(rightTime) || Number.isNaN(leftTime)) return 0
    return rightTime - leftTime
  })
}

export function getNoticeReactionUsers(noticeId: string): EducationNoticeReactionUser[] {
  return sortByRecent(usersByNoticeId.get(noticeId) ?? [])
}

export function getNoticeReactions(noticeId: string): EducationNoticeReactionSummary[] {
  return summarize(usersByNoticeId.get(noticeId) ?? [])
}

export function toggleNoticeReaction(
  noticeId: string,
  emojiType: string,
  authorName: string,
): { reactionCount: number } {
  const list = usersByNoticeId.get(noticeId) ?? []
  const existingIndex = list.findIndex(row => row.authorName === authorName)
  const existing = existingIndex >= 0 ? list[existingIndex] : undefined
  const reactedAt = new Date().toISOString()

  if (existing && existing.emojiType === emojiType) {
    list.splice(existingIndex, 1)
  } else if (existing) {
    list[existingIndex] = { ...existing, emojiType, reactedAt }
  } else {
    list.push({
      id: `edu-reaction-${Date.now()}`,
      noticeId,
      authorName,
      emojiType,
      reactedAt,
    })
  }

  usersByNoticeId.set(noticeId, list)
  return { reactionCount: list.length }
}
