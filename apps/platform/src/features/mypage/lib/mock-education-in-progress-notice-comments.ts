import { MOCK_MYPAGE_USER_NAME } from './constants'
import type { EducationNoticeComment } from '../model/education-in-progress-notice-types'

const commentsByNoticeId = new Map<string, EducationNoticeComment[]>()

const SEED_COMMENTS: EducationNoticeComment[] = [
  {
    id: 'edu-comment-001',
    noticeId: 'edu-notice-001',
    authorName: '김OO',
    content: '과제 제출 전에 한 번 더 확인하겠습니다.',
    createdAt: '2026-01-15T16:10:00',
  },
  {
    id: 'edu-comment-002',
    noticeId: 'edu-notice-001',
    authorName: '이OO',
    content: '안내 감사합니다. 반 학생들에게도 전달할게요.',
    createdAt: '2026-01-15T16:40:00',
  },
  {
    id: 'edu-comment-003',
    noticeId: 'edu-notice-001',
    authorName: MOCK_MYPAGE_USER_NAME,
    content: '참고해서 이번 과제부터 적용하겠습니다.',
    createdAt: '2026-01-15T17:05:00',
  },
  {
    id: 'edu-comment-004',
    noticeId: 'edu-notice-001',
    authorName: '박OO',
    content: '교재 준비는 완료했습니다.',
    createdAt: '2026-01-15T17:20:00',
  },
  {
    id: 'edu-comment-005',
    noticeId: 'edu-notice-001',
    authorName: '주OO',
    content: '다음 수업 때도 같은 기준으로 안내하면 될까요?',
    createdAt: '2026-01-15T18:00:00',
  },
  {
    id: 'edu-comment-006',
    noticeId: 'edu-notice-001',
    authorName: '최OO',
    content: '확인했습니다.',
    createdAt: '2026-01-15T18:30:00',
  },
  {
    id: 'edu-comment-007',
    noticeId: 'edu-notice-002',
    authorName: '김틴토',
    content: '교재 꼭 챙겨 주세요.',
    createdAt: '2026-01-10T11:00:00',
  },
  {
    id: 'edu-comment-008',
    noticeId: 'edu-notice-002',
    authorName: MOCK_MYPAGE_USER_NAME,
    content: '네, 준비해 두었습니다.',
    createdAt: '2026-01-10T12:20:00',
  },
  {
    id: 'edu-comment-009',
    noticeId: 'edu-notice-003',
    authorName: 'JA KOREA',
    content: '수업 하루 전 리마인드입니다.',
    createdAt: '2026-01-05T11:00:00',
  },
  {
    id: 'edu-comment-010',
    noticeId: 'edu-notice-003',
    authorName: '윤OO',
    content: '필기도구까지 챙기겠습니다.',
    createdAt: '2026-01-05T12:00:00',
  },
]

function resetStore() {
  commentsByNoticeId.clear()
  for (const row of SEED_COMMENTS) {
    const list = commentsByNoticeId.get(row.noticeId) ?? []
    list.push(row)
    commentsByNoticeId.set(row.noticeId, list)
  }
}

resetStore()

function sortByCreatedAt(comments: EducationNoticeComment[]): EducationNoticeComment[] {
  return [...comments].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt))
}

export function getNoticeComments(noticeId: string): EducationNoticeComment[] {
  return sortByCreatedAt(commentsByNoticeId.get(noticeId) ?? [])
}

export function addNoticeComment(
  noticeId: string,
  authorName: string,
  content: string,
): { commentCount: number; comment: EducationNoticeComment } {
  const list = commentsByNoticeId.get(noticeId) ?? []
  const comment: EducationNoticeComment = {
    id: `edu-comment-${Date.now()}`,
    noticeId,
    authorName,
    content,
    createdAt: new Date().toISOString(),
  }
  list.push(comment)
  commentsByNoticeId.set(noticeId, list)
  return { commentCount: list.length, comment }
}

export function updateNoticeComment(commentId: string, content: string): EducationNoticeComment | null {
  for (const [noticeId, list] of commentsByNoticeId) {
    const index = list.findIndex(row => row.id === commentId)
    if (index < 0) continue
    const current = list[index]
    if (!current) continue
    const next = { ...current, content }
    list[index] = next
    commentsByNoticeId.set(noticeId, list)
    return next
  }
  return null
}

export function deleteNoticeComment(commentId: string): { noticeId: string; commentCount: number } | null {
  for (const [noticeId, list] of commentsByNoticeId) {
    const index = list.findIndex(row => row.id === commentId)
    if (index < 0) continue
    list.splice(index, 1)
    commentsByNoticeId.set(noticeId, list)
    return { noticeId, commentCount: list.length }
  }
  return null
}
