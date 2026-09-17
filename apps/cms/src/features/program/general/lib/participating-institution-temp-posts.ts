/**
 * TODO(temp-mock): 열여라 참깨 — 참여 기관 상세 게시글 검증 후 삭제
 */

import type { ProgramFile, ProgramPost } from '@/types/domain'

export const TEMP_PARTICIPATING_INSTITUTION_POST_PREFIX = 'temp-institution-post-'

export function buildTemporaryParticipatingInstitutionPosts(
  programId: string,
  schoolId: string
): ProgramPost[] {
  const now = '2026-09-17T10:00:00+09:00'
  const base = [
    {
      suffix: 'notice-unread',
      title: '교육 시작 안내',
      content:
        '안녕하세요. 다음 주 월요일부터 경제교육이 시작됩니다.\n교실 준비와 교재 수령을 부탁드립니다.',
      read: false,
      viewCount: 3,
      reactionCount: 2,
      commentCount: 1,
      attachmentCount: 1,
      postType: 'notice' as const,
      audience: ['teacher', 'instructor'],
      publishedAt: '2026-09-15T09:30:00+09:00',
      authorName: 'JA KOREA 알림',
    },
    {
      suffix: 'schedule-read',
      title: '2회차 일정 변경 안내',
      content: '2회차 교육 일정이 10월 20일(화) 10:00으로 변경되었습니다.',
      read: true,
      viewCount: 12,
      reactionCount: 5,
      commentCount: 3,
      attachmentCount: 0,
      postType: 'schedule' as const,
      audience: ['all'],
      publishedAt: '2026-09-14T14:20:00+09:00',
      authorName: '김하늘 담당교사',
    },
    {
      suffix: 'notice-attachment',
      title: '교재 배송 확인 요청',
      content: '배송된 교재 수량과 상태를 확인해 주시고, 이상 시 첨부 양식으로 회신 부탁드립니다.',
      read: false,
      viewCount: 7,
      reactionCount: 1,
      commentCount: 0,
      attachmentCount: 2,
      postType: 'notice' as const,
      audience: ['teacher'],
      publishedAt: '2026-09-13T11:05:00+09:00',
      authorName: 'JA KOREA 알림',
    },
    {
      suffix: 'general-read',
      title: '학생 명단 제출 마감 안내',
      content: '학생 명단 제출 마감은 9월 25일(금)입니다. 미제출 시 출석·수료 처리가 지연될 수 있습니다.',
      read: true,
      viewCount: 18,
      reactionCount: 4,
      commentCount: 2,
      attachmentCount: 1,
      postType: 'notice' as const,
      audience: ['teacher', 'student'],
      publishedAt: '2026-09-12T16:40:00+09:00',
      authorName: '이도윤 강사',
    },
    {
      suffix: 'schedule-upcoming',
      title: '학부모 공개수업 일정',
      content: '3회차 교육은 학부모 공개수업으로 진행됩니다. 참관 인원 사전 안내를 부탁드립니다.',
      read: false,
      viewCount: 1,
      reactionCount: 0,
      commentCount: 0,
      attachmentCount: 0,
      postType: 'schedule' as const,
      audience: ['teacher', 'volunteer'],
      publishedAt: '2026-09-11T08:15:00+09:00',
      authorName: 'JA KOREA 알림',
    },
  ]

  return base.map((item, index) => ({
    id: `${TEMP_PARTICIPATING_INSTITUTION_POST_PREFIX}${schoolId}-${item.suffix}`,
    programId,
    schoolId,
    authorName: item.authorName,
    createdByActorType: item.authorName === 'JA KOREA 알림' ? 'ADMIN' : 'MEMBER',
    title: item.title,
    content: item.content,
    read: item.read,
    viewCount: item.viewCount,
    reactionCount: item.reactionCount,
    commentCount: item.commentCount,
    attachmentCount: item.attachmentCount,
    postType: item.postType,
    audience: item.audience,
    publishedAt: item.publishedAt,
    createdAt: item.publishedAt,
    updatedAt: index === 0 ? now : item.publishedAt,
  }))
}

export function buildTemporaryParticipatingInstitutionPostFiles(
  programId: string,
  schoolId: string
): ProgramFile[] {
  const posts = buildTemporaryParticipatingInstitutionPosts(programId, schoolId)
  const noticeUnread = posts.find(p => p.id.endsWith('notice-unread'))
  const noticeAttachment = posts.find(p => p.id.endsWith('notice-attachment'))
  const generalRead = posts.find(p => p.id.endsWith('general-read'))

  const files: Array<{
    id: string
    postId?: string
    fileName: string
    fileType: string
    fileSize: number
    uploadedAt: string
  }> = [
    {
      id: `${TEMP_PARTICIPATING_INSTITUTION_POST_PREFIX}file-${schoolId}-1`,
      postId: noticeUnread?.id,
      fileName: '교육_시작_안내문.pdf',
      fileType: 'pdf',
      fileSize: 512_000,
      uploadedAt: '2026-09-15T09:31:00+09:00',
    },
    {
      id: `${TEMP_PARTICIPATING_INSTITUTION_POST_PREFIX}file-${schoolId}-2`,
      postId: noticeAttachment?.id,
      fileName: '교재_수령_확인서.xlsx',
      fileType: 'xlsx',
      fileSize: 86_000,
      uploadedAt: '2026-09-13T11:06:00+09:00',
    },
    {
      id: `${TEMP_PARTICIPATING_INSTITUTION_POST_PREFIX}file-${schoolId}-3`,
      postId: noticeAttachment?.id,
      fileName: '배송_체크리스트.pdf',
      fileType: 'pdf',
      fileSize: 220_000,
      uploadedAt: '2026-09-13T11:07:00+09:00',
    },
    {
      id: `${TEMP_PARTICIPATING_INSTITUTION_POST_PREFIX}file-${schoolId}-4`,
      postId: generalRead?.id,
      fileName: '학생명단_양식.xlsx',
      fileType: 'xlsx',
      fileSize: 64_000,
      uploadedAt: '2026-09-12T16:41:00+09:00',
    },
  ]

  return files.map(file => ({
    id: file.id,
    programId,
    postId: file.postId,
    fileName: file.fileName,
    fileType: file.fileType,
    fileSize: file.fileSize,
    fileUrl: `data:application/octet-stream;base64,`,
    uploadedAt: file.uploadedAt,
    createdAt: file.uploadedAt,
    updatedAt: file.uploadedAt,
  }))
}
