/**
 * 프로그램 게시글 Mock 데이터
 * 수강 프로그램 상세 모달 — 게시글 탭
 * mockPrograms의 programId와 연동하여 정합성 유지
 */

import type { ProgramPost, UUID } from '../../types'
import { mockPrograms } from './programs'

function date(daysAgo: number, hour: number = 15, minute: number = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

/** programId별 게시글 목록 생성. mockPrograms에 존재하는 programId만 사용 */
function buildPosts(): ProgramPost[] {
  const programIds = mockPrograms.slice(0, 10).map(p => p.id)
  const authors = [
    '박○○ 담당교사님',
    '김틴토 강사님',
    'JA KOREA 알림',
    '이○○ 담당교사님',
    '담당 매니저',
  ]
  const contents = [
    '2026년 1학기 경제금융교육 일정이 확정되었습니다. 참여 학교 담당교사님께서는 첨부된 일정표를 확인해 주시기 바랍니다.',
    '강사 대기실 위치가 변경되었습니다. 당일 안내도는 첨부 파일을 참고해 주세요. 문의사항은 담당 매니저에게 연락 부탁드립니다.',
    '최근 과제 제출과 관련하여 다른 반 친구의 과제를 그대로 베끼거나, GPT 등에 답을 맡기는 사례가 많다는 소식을 전해 들었습니다.\n\n틴토고등학교 학생 여러분, 과제를 스스로 성실히 수행하는 학생이 되어 주시기 바랍니다.\n\n앞으로 타인의 글을 베끼거나 대신 작성한 것으로 확인되는 과제는 0점 처리하며 재제출이 필요합니다.',
    '2회차 강의가 다음 주 금요일로 예정되어 있습니다. 교재 미배송 학교는 연락 주시면 재발송 도와드리겠습니다.',
    '만족도 설문 링크가 발송되었습니다. 참여해 주신 모든 분들께 감사드립니다.',
    '1회차 강의가 잘 마무리되었습니다. 2회차에서는 기업과 경제적 개념을 다룰 예정이오니 미리 교재 2장을 읽어 오시면 좋겠습니다. 수업 전 질문이 있으시면 게시판에 남겨 주시면 강의 중 참고하겠습니다.',
    '[공지] 교육 당일 주차는 건물 지하 B2를 이용해 주세요. 출입증은 당일 오전 문자로 발송됩니다.',
    '질의응답 시간에 자주 나온 내용을 정리한 FAQ를 첨부했습니다. 추가 문의는 댓글로 남겨 주세요.',
    '본 프로그램은 JA Korea와 협력하여 진행되는 정규 교육 과정입니다. 수업 자료는 교육 3일 전까지 공지될 예정이며, 교재는 각 학교로 발송 완료되었습니다. 미수령 시 담당 매니저에게 연락 부탁드립니다.',
  ]

  const posts: ProgramPost[] = []
  let idSeq = 1

  programIds.forEach((programId, idx) => {
    const postCount = idx === 0 ? 5 : idx < 4 ? 2 : 1
    for (let i = 0; i < postCount; i++) {
      const publishedAt = date(30 - idx * 5 - i * 2, 14 + i, i * 10)
      const isRead =
        idx === 0 ? [1, 3].includes(i) : i === 1 && idx === 1
      const postTypeByIndex: ProgramPost['postType'][] = ['notice', 'schedule', undefined, 'notice', 'schedule']
      const postType: ProgramPost['postType'] = idx === 0 ? postTypeByIndex[i] : i === 0 ? 'notice' : i === 1 ? 'schedule' : undefined
      const contentIndexForFirstProgram = [0, 1, 2, 3, 8]
      const contentIndex = idx === 0 ? contentIndexForFirstProgram[i] : (idx + i) % contents.length
      posts.push({
        id: `post-${String(idSeq).padStart(3, '0')}` as UUID,
        programId,
        authorName: authors[idx === 0 ? i % authors.length : (idx + i) % authors.length],
        title: undefined,
        content: contents[contentIndex],
        read: isRead,
        viewCount: 12 + idx * 3 + i * 2,
        reactionCount: 10 + idx + i * 2,
        commentCount: idx === 0 ? [0, 2, 1, 0, 3][i] : i,
        attachmentCount: postType === 'schedule' ? 2 : i === 2 && idx === 0 ? 1 : 0,
        postType,
        publishedAt,
        createdAt: publishedAt,
        updatedAt: publishedAt,
      })
      idSeq += 1
    }
  })

  return posts
}

export const mockProgramPosts: ProgramPost[] = buildPosts()

const byProgramId = new Map<UUID, ProgramPost[]>()
mockProgramPosts.forEach(post => {
  const list = byProgramId.get(post.programId) ?? []
  list.push(post)
  byProgramId.set(post.programId, list)
})
byProgramId.forEach(list => list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()))

/** 프로그램 ID로 게시글 목록 조회 (최신순) */
export function getProgramPostsByProgramId(programId: UUID): ProgramPost[] {
  return (byProgramId.get(programId) ?? []).slice()
}

export const mockProgramPostsMap = new Map(mockProgramPosts.map(p => [p.id, p]))
