/**
 * 게시글 읽음/안읽음 뷰어 Mock — 프로그램 승인 신청 기준 할당 인원 + 학교 스코프 필터
 */

import type { UUID } from '../../types'
import type { Application, ApplicationSubjectType, ProgramPostReadRow } from '../../types/domain'
import { mockApplications } from './applications'
import { mockProgramPosts, mockProgramPostsMap } from './program-posts'
import { mockSchoolsMap } from './schools'
import { mockUsers } from './users'
import { mockInstructorsMap } from './instructors'
import { MOCK_PARTICIPATING_SCHOOLS } from './participating-schools'

const usersById = new Map(mockUsers.map(u => [u.id, u]))

function hashToUnit(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h) % 100
}

/** 게시글·스코프마다 다른 값 — 읽음 목표 인원 산출용 */
function hashToPositiveInt(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h) >>> 0
}

/**
 * 읽음/안읽음을 고르게(대략 30~70% 구간) — 게시글·스코프마다 목표 읽음 수가 다름.
 * 수신자 2명 이상이면 읽음·안읽음이 모두 최소 1명 이상이 되도록 함.
 */
function targetReadCountBalanced(
  postId: UUID,
  programId: UUID,
  schoolScopeId: string | null | undefined,
  total: number
): number {
  if (total <= 0) return 0
  const key = `readSplit:${postId}:${programId}:${schoolScopeId ?? ''}`
  if (total === 1) return hashToPositiveInt(key) % 2

  const minR = Math.max(1, Math.floor(total * 0.3))
  const maxR = Math.min(total - 1, Math.ceil(total * 0.7))
  if (minR <= maxR) {
    return minR + (hashToPositiveInt(key) % (maxR - minR + 1))
  }
  return Math.max(1, Math.min(total - 1, Math.floor(total / 2)))
}

/** 참여기관 id(school-1) 또는 도메인 School id → 학교명 */
export function resolveSchoolScopeName(schoolScopeId?: string | null): string | undefined {
  if (!schoolScopeId) return undefined
  const row = MOCK_PARTICIPATING_SCHOOLS.find(s => s.id === schoolScopeId)
  if (row) return row.schoolName
  return mockSchoolsMap.get(schoolScopeId as UUID)?.name
}

function roleLabelForSubject(t: ApplicationSubjectType): string {
  switch (t) {
    case 'school':
      return '담당교사'
    case 'student':
      return '학생'
    case 'instructor':
      return '강사'
    case 'volunteer':
      return '봉사자'
    default:
      return '참여자'
  }
}

function displayNameForApplication(app: Application): string {
  if (app.subjectType === 'school') {
    const sch = mockSchoolsMap.get(app.subjectId)
    if (!sch) return '학교'
    const first = sch.contactPerson?.trim()?.[0] ?? '담'
    return `${first}○○`
  }
  if (app.subjectType === 'instructor') {
    const ins = mockInstructorsMap.get(app.subjectId)
    if (!ins) return '강사'
    const first = ins.name.trim()[0] ?? '강'
    return `${first}○○`
  }
  if (app.subjectType === 'student' || app.subjectType === 'volunteer') {
    const u = usersById.get(app.subjectId)
    if (!u?.name) return '사용자'
    const first = u.name.trim()[0] ?? '이'
    return `${first}○○`
  }
  return '참여자'
}

function audienceKey(app: Application): string {
  return `${app.subjectType}:${app.subjectId}`
}

export interface AudienceMember {
  recipientKey: string
  displayName: string
  roleLabel: string
}

/** programId 기준 승인 신청에서 할당 인원 목록 (dedupe). schoolScopeId 있으면 해당 학교명과 연결된 행만 */
export function buildAudienceForProgram(programId: UUID, schoolScopeId?: string | null): AudienceMember[] {
  const scopeName = resolveSchoolScopeName(schoolScopeId)
  const apps = mockApplications.filter(a => a.programId === programId && a.status === 'approved')

  let filtered: Application[]
  if (scopeName) {
    filtered = apps.filter(app => {
      if (app.subjectType === 'school') {
        const sch = mockSchoolsMap.get(app.subjectId)
        return sch?.name === scopeName
      }
      if (app.subjectType === 'student') {
        const u = usersById.get(app.subjectId)
        return u?.schoolInfo?.schoolName === scopeName
      }
      return false
    })
  } else {
    filtered = apps
  }

  const seen = new Set<string>()
  const members: AudienceMember[] = []
  for (const app of filtered) {
    const k = audienceKey(app)
    if (seen.has(k)) continue
    seen.add(k)
    members.push({
      recipientKey: k,
      displayName: displayNameForApplication(app),
      roleLabel: roleLabelForSubject(app.subjectType),
    })
  }

  if (members.length === 0 && scopeName) {
    const fallbackNames = ['김OO', '이OO', '박OO', '주OO', '최OO']
    const roles: string[] = ['학생', '관리자', '강사', '대표 강사', '담당교사']
    fallbackNames.forEach((name, i) => {
      members.push({
        recipientKey: `fallback:${schoolScopeId}:${i}`,
        displayName: name,
        roleLabel: roles[i % roles.length],
      })
    })
  }

  return members
}

/** 읽음 처리 시각 — postId+recipient 기준 결정론적 ISO 문자열 */
function readAtForRecipient(postId: UUID, recipientKey: string): string {
  const h = hashToUnit(`readAt:${postId}:${recipientKey}`)
  const base = new Date('2026-01-01T09:00:00.000Z')
  base.setMinutes(base.getMinutes() + (h % 720))
  base.setSeconds(h % 60)
  return base.toISOString()
}

function rowsForPost(postId: UUID, programId: UUID, schoolScopeId?: string | null): ProgramPostReadRow[] {
  const members = buildAudienceForProgram(programId, schoolScopeId)
  const total = members.length
  const targetRead = targetReadCountBalanced(postId, programId, schoolScopeId, total)

  const order = members.map((_, i) => i)
  order.sort((a, b) => {
    const ha = hashToUnit(`readPick:${postId}:${members[a].recipientKey}`)
    const hb = hashToUnit(`readPick:${postId}:${members[b].recipientKey}`)
    return ha - hb || a - b
  })
  const readIndexSet = new Set(order.slice(0, targetRead))

  return members.map((m, index) => {
    const hasRead = readIndexSet.has(index)
    return {
      id: `post-read-${postId}-${index}` as UUID,
      postId,
      displayName: m.displayName,
      roleLabel: m.roleLabel,
      hasRead,
      readAt: hasRead ? readAtForRecipient(postId, m.recipientKey) : undefined,
    }
  })
}

/** 게시글별 읽음 행 — schoolScopeId: 탭 학교 우선 시 부모에서 `tabSchoolId ?? post.schoolId` 전달 */
export function getPostReadRows(
  postId: UUID,
  programId: UUID,
  schoolScopeId?: string | null
): ProgramPostReadRow[] {
  return rowsForPost(postId, programId, schoolScopeId)
}

export function getReadUnreadCountsForPost(
  postId: UUID,
  programId: UUID,
  schoolScopeId?: string | null
): { read: number; unread: number; total: number } {
  const rows = rowsForPost(postId, programId, schoolScopeId)
  const read = rows.filter(r => r.hasRead).length
  return { read, unread: rows.length - read, total: rows.length }
}

/** post 엔티티 기준 스코프(post.schoolId) — viewCount 동기화·상세 모달용 */
export function getReadUnreadCountsByPostId(postId: UUID): { read: number; unread: number; total: number } {
  const post = mockProgramPostsMap.get(postId)
  if (!post) return { read: 0, unread: 0, total: 0 }
  return getReadUnreadCountsForPost(post.id, post.programId, post.schoolId ?? null)
}

/** 메타 조회수 = 읽음 인원 수 (post 스코프 기준; 목록은 getPostViewCountForContext 사용 권장) */
export function getPostViewCountByPostId(postId: UUID): number {
  return getReadUnreadCountsByPostId(postId).read
}

/** 게시글 탭: 학교 탭이면 tabSchoolId로 필터 */
export function getPostViewCountForContext(
  postId: UUID,
  programId: UUID,
  postSchoolId: UUID | undefined,
  tabSchoolId?: string | null
): number {
  const scope = tabSchoolId ?? postSchoolId ?? null
  return getReadUnreadCountsForPost(postId, programId, scope).read
}

function syncPostViewCountsFromReadRows(): void {
  for (const post of mockProgramPosts) {
    post.viewCount = getReadUnreadCountsForPost(post.id, post.programId, post.schoolId ?? null).read
  }
}

syncPostViewCountsFromReadRows()
