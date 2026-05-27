/**
 * 프로그램 게시글 Mock 데이터
 * 수강 프로그램 상세 모달 — 게시글 탭
 * mockPrograms의 programId와 연동, 참여기관(학교)별 게시글 포함
 */

import type { ProgramPost, UUID } from '../../types'
import { mockPrograms } from './programs'
import { MOCK_PARTICIPATING_SCHOOLS } from './participating-schools'

function date(daysAgo: number, hour: number = 15, minute: number = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

/** HSBC/HKU Business Case Competition 2026 모집 안내 + 강서초등학교 전용 게시글 (스크린샷 3장) */
const HSBC_ECONOMY_PROGRAM_ID = 'economy-prog-001' as UUID
const GANGSEO_SCHOOL_ID = 'school-1'

function buildPostsForHSBCGangseo(): ProgramPost[] {
  const posts: ProgramPost[] = [
    {
      id: 'post-hsbc-gs-001' as UUID,
      programId: HSBC_ECONOMY_PROGRAM_ID,
      schoolId: GANGSEO_SCHOOL_ID as UUID,
      authorName: '박○○ 담당교사님',
      content:
        '최근 과제 제출과 관련하여 다른 반 친구의 과제를 그대로 베끼거나, GPT 등에 답을 맡기는 사례가 많다는 소식을 전해 들었습니다.\n\n강서초등학교 학생 여러분, 과제를 스스로 성실히 수행하는 학생이 되어 주시기 바랍니다.\n\n앞으로 타인의 글을 베끼거나 대신 작성한 것으로 확인되는 과제는 0점 처리하며 재제출이 필요합니다.',
      read: false,
      viewCount: 12,
      reactionCount: 10,
      commentCount: 2,
      attachmentCount: 0,
      postType: 'notice',
      publishedAt: new Date(2026, 0, 15, 15, 0, 0).toISOString(),
      createdAt: new Date(2026, 0, 15, 15, 0, 0).toISOString(),
      updatedAt: new Date(2026, 0, 15, 15, 0, 0).toISOString(),
    },
    {
      id: 'post-hsbc-gs-002' as UUID,
      programId: HSBC_ECONOMY_PROGRAM_ID,
      schoolId: GANGSEO_SCHOOL_ID as UUID,
      authorName: '김틴토 강사님',
      content:
        '2회차 강의의 테마는 "나를 보여주는 기술"입니다. 면접 태도와 모의 면접을 다룰 예정이오니 교재를 꼭 준비해 주시고, 이번 주까지 과제 제출 부탁드립니다.',
      read: false,
      viewCount: 12,
      reactionCount: 10,
      commentCount: 2,
      attachmentCount: 2,
      postType: 'notice',
      publishedAt: new Date(2026, 0, 10, 10, 0, 0).toISOString(),
      createdAt: new Date(2026, 0, 10, 10, 0, 0).toISOString(),
      updatedAt: new Date(2026, 0, 10, 10, 0, 0).toISOString(),
    },
    {
      id: 'post-hsbc-gs-003' as UUID,
      programId: HSBC_ECONOMY_PROGRAM_ID,
      schoolId: GANGSEO_SCHOOL_ID as UUID,
      authorName: 'JA KOREA 알림',
      content:
        '1회차 수업 하루 전입니다. 내일 진행될 단원 내용을 미리 준비해 주시기 바랍니다!',
      read: true,
      viewCount: 12,
      reactionCount: 10,
      commentCount: 2,
      attachmentCount: 0,
      postType: 'schedule',
      publishedAt: new Date(2026, 0, 5, 10, 0, 0).toISOString(),
      createdAt: new Date(2026, 0, 5, 10, 0, 0).toISOString(),
      updatedAt: new Date(2026, 0, 5, 10, 0, 0).toISOString(),
    },
  ]
  return posts
}

/** 참여기관(학교)별 게시글 생성 — 해당 학교 전용 공지/일정 (진월초등학교 등) */
function buildPostsForSchools(): ProgramPost[] {
  const programId = mockPrograms[0]?.id
  if (!programId) return []

  const authors = [
    '박○○ 담당교사님',
    '김틴토 강사님',
    'JA KOREA 알림',
    '이○○ 담당교사님',
    '담당 매니저',
  ]
  const schoolRows = MOCK_PARTICIPATING_SCHOOLS.slice(0, 12)
  const posts: ProgramPost[] = []
  let idSeq = 1000

  schoolRows.forEach((school, schoolIdx) => {
    const schoolName = school.schoolName
    const postCount = schoolIdx < 3 ? 5 : schoolIdx < 6 ? 3 : 2
    const contentsForSchool = [
      `${schoolName} 담당교사님께 안내드립니다. 2026년 1학기 경제금융교육 일정이 확정되었습니다. 첨부된 일정표를 확인해 주시기 바랍니다.`,
      `[${schoolName}] 강사 대기실 위치가 변경되었습니다. 당일 안내도는 첨부 파일을 참고해 주세요.`,
      `${schoolName} 1회차 강의가 잘 마무리되었습니다. 2회차에서는 기업과 경제적 개념을 다룰 예정이오니 미리 교재 2장을 읽어 오시면 좋겠습니다.`,
      `[공지] ${schoolName} 교육 당일 주차는 건물 지하 B2를 이용해 주세요. 출입증은 당일 오전 문자로 발송됩니다.`,
      `${schoolName} 만족도 설문 링크가 발송되었습니다. 참여해 주신 모든 분들께 감사드립니다.`,
      `[일정] ${schoolName} 2회차 강의가 다음 주 금요일로 예정되어 있습니다. 교재 미배송 시 연락 주시면 재발송 도와드리겠습니다.`,
      `${schoolName} 질의응답 시간에 자주 나온 내용을 정리한 FAQ를 첨부했습니다. 추가 문의는 댓글로 남겨 주세요.`,
    ]

    for (let i = 0; i < postCount; i++) {
      const publishedAt = date(20 - schoolIdx * 2 - i, 14 + (i % 3), i * 5)
      const isRead = schoolIdx === 0 ? [0, 2].includes(i) : i === 0
      const postType: ProgramPost['postType'] = i % 3 === 0 ? 'notice' : i % 3 === 1 ? 'schedule' : undefined
      const contentIndex = i % contentsForSchool.length
      posts.push({
        id: `post-${String(idSeq).padStart(3, '0')}` as UUID,
        programId,
        schoolId: school.id as UUID,
        authorName: authors[(schoolIdx + i) % authors.length],
        title: undefined,
        content: contentsForSchool[contentIndex],
        read: isRead,
        viewCount: 8 + schoolIdx + i * 2,
        reactionCount: 5 + i,
        commentCount: i % 2,
        attachmentCount: postType === 'schedule' ? 2 : i === 1 ? 1 : 0,
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

/** programId별 게시글 목록 생성. mockPrograms에 존재하는 programId만 사용 (프로그램 전체 공지) */
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

/** UJAT 초등 경제교육 — 참여 기관(기관 id)별 게시글 mock 시드 프로그램 */
export const UJAT_EDUCATION_IN_PROGRESS_PROGRAM_ID = 'ujat-progress-education-in-progress' as UUID

function isUjatProgressProgramId(programId: string): boolean {
  return programId.startsWith('ujat-progress-')
}

function ujatIsoDate(year: number, month: number, day: number, hour: number, minute = 0): string {
  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString()
}

type UjatInstitutionPostSeed = Omit<ProgramPost, 'id' | 'programId' | 'schoolId'>

function ujatLongContent(schoolName: string): string {
  return (
    `최근 과제 제출과 관련하여 다른 반 친구의 과제를 그대로 베끼거나, GPT 등에 답을 맡기는 사례가 많다는 소식을 전해 들었습니다.\n\n` +
    `${schoolName} 학생 여러분, 과제를 스스로 성실히 수행하는 학생이 되어 주시기 바랍니다.\n\n` +
    '앞으로 타인의 글을 베끼거나 대신 작성한 것으로 확인되는 과제는 0점 처리하며 재제출이 필요합니다.\n\n' +
    '추가 안내 사항은 첨부 파일을 참고해 주시고, 문의는 게시판 댓글로 남겨 주세요.'
  )
}

function buildPostsForUjatInstitutions(): ProgramPost[] {
  const programId = UJAT_EDUCATION_IN_PROGRESS_PROGRAM_ID

  const institutionPosts: Array<{
    institutionId: string
    posts: UjatInstitutionPostSeed[]
  }> = [
    {
      institutionId: 'gwangju-jinwol',
      posts: [
        {
          authorName: '박○○ 담당교사님',
          content: ujatLongContent('진월초등학교'),
          read: false,
          viewCount: 12,
          reactionCount: 10,
          commentCount: 2,
          attachmentCount: 0,
          postType: 'notice',
          publishedAt: ujatIsoDate(2026, 1, 15, 15, 0),
          createdAt: ujatIsoDate(2026, 1, 15, 15, 0),
          updatedAt: ujatIsoDate(2026, 1, 15, 15, 0),
        },
        {
          authorName: '김○○ 강사님',
          content:
            '2회차 강의의 테마는 "나를 보여주는 기술"입니다. 면접 태도와 모의 면접을 다룰 예정이오니 교재를 꼭 준비해 주시고, 이번 주까지 과제 제출 부탁드립니다.',
          read: false,
          viewCount: 12,
          reactionCount: 10,
          commentCount: 2,
          attachmentCount: 2,
          postType: 'notice',
          publishedAt: ujatIsoDate(2026, 1, 10, 10, 0),
          createdAt: ujatIsoDate(2026, 1, 10, 10, 0),
          updatedAt: ujatIsoDate(2026, 1, 10, 10, 0),
        },
        {
          authorName: '담당 매니저',
          content:
            '1회차 수업 하루 전입니다. 내일 진행될 단원 내용을 미리 준비해 주시기 바랍니다!',
          read: true,
          viewCount: 12,
          reactionCount: 10,
          commentCount: 2,
          attachmentCount: 0,
          postType: 'schedule',
          publishedAt: ujatIsoDate(2026, 1, 5, 10, 0),
          createdAt: ujatIsoDate(2026, 1, 5, 10, 0),
          updatedAt: ujatIsoDate(2026, 1, 5, 10, 0),
        },
        {
          authorName: '오○○ 봉사자님',
          content:
            '4월 17일 2학년 교육 전 학급 이동 동선을 사전에 확인했습니다. 현장 도착 후 10분 전까지 강사 대기실에서 대기하겠습니다.',
          read: true,
          viewCount: 9,
          reactionCount: 6,
          commentCount: 1,
          attachmentCount: 1,
          publishedAt: ujatIsoDate(2026, 1, 3, 16, 30),
          createdAt: ujatIsoDate(2026, 1, 3, 16, 30),
          updatedAt: ujatIsoDate(2026, 1, 3, 16, 30),
        },
        {
          authorName: '담당 매니저',
          content:
            '[공지] 진월초등학교 4월 교육 일정 확정 안내입니다. 첨부된 일정표를 확인해 주세요.',
          read: false,
          viewCount: 15,
          reactionCount: 4,
          commentCount: 0,
          attachmentCount: 1,
          postType: 'notice',
          publishedAt: ujatIsoDate(2025, 12, 20, 11, 0),
          createdAt: ujatIsoDate(2025, 12, 20, 11, 0),
          updatedAt: ujatIsoDate(2025, 12, 20, 11, 0),
        },
      ],
    },
    {
      institutionId: 'seoul-5',
      posts: [
        {
          authorName: '최○○ 담당교사님',
          content:
            '서울신동초등학교 1학기 JA Korea 초등 경제교육 일정이 확정되었습니다. 첨부된 안내문을 확인해 주시기 바랍니다.',
          read: false,
          viewCount: 10,
          reactionCount: 8,
          commentCount: 2,
          attachmentCount: 2,
          postType: 'notice',
          publishedAt: ujatIsoDate(2026, 1, 14, 14, 0),
          createdAt: ujatIsoDate(2026, 1, 14, 14, 0),
          updatedAt: ujatIsoDate(2026, 1, 14, 14, 0),
        },
        {
          authorName: '정○○ 강사님',
          content:
            '5학년 수업 전 교구 점검을 완료했습니다. 수업 당일 교실 앞 복도에서 학급별로 나눠 드리겠습니다.',
          read: false,
          viewCount: 7,
          reactionCount: 5,
          commentCount: 1,
          attachmentCount: 0,
          publishedAt: ujatIsoDate(2026, 1, 11, 9, 0),
          createdAt: ujatIsoDate(2026, 1, 11, 9, 0),
          updatedAt: ujatIsoDate(2026, 1, 11, 9, 0),
        },
        {
          authorName: '담당 매니저',
          content: '교재 배송이 완료되었습니다. 미수령 학급이 있으면 연락 부탁드립니다.',
          read: true,
          viewCount: 11,
          reactionCount: 3,
          commentCount: 0,
          attachmentCount: 0,
          postType: 'schedule',
          publishedAt: ujatIsoDate(2026, 1, 7, 15, 30),
          createdAt: ujatIsoDate(2026, 1, 7, 15, 30),
          updatedAt: ujatIsoDate(2026, 1, 7, 15, 30),
        },
        {
          authorName: '윤○○ 학생',
          content: '1회차 수업이 재미있었습니다. 다음 수업도 기대하고 있어요!',
          read: true,
          viewCount: 4,
          reactionCount: 12,
          commentCount: 3,
          attachmentCount: 0,
          publishedAt: ujatIsoDate(2026, 1, 4, 13, 0),
          createdAt: ujatIsoDate(2026, 1, 4, 13, 0),
          updatedAt: ujatIsoDate(2026, 1, 4, 13, 0),
        },
      ],
    },
    {
      institutionId: 'seoul-3',
      posts: [
        {
          authorName: '이○○ 담당교사님',
          content:
            '서울숭인초등학교 2026년 1학기 경제금융교육 일정이 확정되었습니다. 첨부된 일정표를 확인해 주시기 바랍니다.',
          read: false,
          viewCount: 8,
          reactionCount: 4,
          commentCount: 1,
          attachmentCount: 1,
          postType: 'notice',
          publishedAt: ujatIsoDate(2026, 1, 12, 14, 0),
          createdAt: ujatIsoDate(2026, 1, 12, 14, 0),
          updatedAt: ujatIsoDate(2026, 1, 12, 14, 0),
        },
        {
          authorName: '담당 매니저',
          content: '교재 배송이 완료되었습니다. 미수령 시 연락 부탁드립니다.',
          read: true,
          viewCount: 6,
          reactionCount: 2,
          commentCount: 0,
          attachmentCount: 0,
          publishedAt: ujatIsoDate(2026, 1, 8, 11, 0),
          createdAt: ujatIsoDate(2026, 1, 8, 11, 0),
          updatedAt: ujatIsoDate(2026, 1, 8, 11, 0),
        },
        {
          authorName: '한○○ 봉사자님',
          content: '6월 교육 일정 관련하여 사전 협의 요청드립니다. 가능한 시간대를 댓글로 알려 주세요.',
          read: false,
          viewCount: 5,
          reactionCount: 1,
          commentCount: 2,
          attachmentCount: 0,
          publishedAt: ujatIsoDate(2026, 1, 2, 10, 0),
          createdAt: ujatIsoDate(2026, 1, 2, 10, 0),
          updatedAt: ujatIsoDate(2026, 1, 2, 10, 0),
        },
      ],
    },
    {
      institutionId: 'seoul-4',
      posts: [
        {
          authorName: '박○○ 담당교사님',
          content:
            '서울대명초등학교 교육 일정 관련 문의드립니다. 4월 17일 수업 교실 배정이 확정되면 공유 부탁드립니다.',
          read: false,
          viewCount: 6,
          reactionCount: 2,
          commentCount: 1,
          attachmentCount: 0,
          publishedAt: ujatIsoDate(2026, 1, 13, 11, 0),
          createdAt: ujatIsoDate(2026, 1, 13, 11, 0),
          updatedAt: ujatIsoDate(2026, 1, 13, 11, 0),
        },
        {
          authorName: '최○○ 봉사자님',
          content:
            '다음 주 금요일 1회차 교육을 진행할 예정입니다. 학급별 인원 확인 부탁드립니다.',
          read: false,
          viewCount: 5,
          reactionCount: 3,
          commentCount: 0,
          attachmentCount: 1,
          publishedAt: ujatIsoDate(2026, 1, 14, 9, 30),
          createdAt: ujatIsoDate(2026, 1, 14, 9, 30),
          updatedAt: ujatIsoDate(2026, 1, 14, 9, 30),
        },
      ],
    },
    {
      institutionId: 'seoul-2',
      posts: [
        {
          authorName: '김○○ 담당교사님',
          content:
            '마포초등학교 담당교사입니다. 교구 상차 지원 일정을 조율하고자 합니다. 가능하신 시간을 알려 주세요.',
          read: true,
          viewCount: 4,
          reactionCount: 1,
          commentCount: 0,
          attachmentCount: 0,
          publishedAt: ujatIsoDate(2026, 1, 9, 14, 0),
          createdAt: ujatIsoDate(2026, 1, 9, 14, 0),
          updatedAt: ujatIsoDate(2026, 1, 9, 14, 0),
        },
        {
          authorName: '담당 매니저',
          content: '프로그램 참여 신청 관련 서류 제출 기한을 안내드립니다.',
          read: false,
          viewCount: 7,
          reactionCount: 0,
          commentCount: 1,
          attachmentCount: 1,
          postType: 'notice',
          publishedAt: ujatIsoDate(2026, 1, 6, 10, 0),
          createdAt: ujatIsoDate(2026, 1, 6, 10, 0),
          updatedAt: ujatIsoDate(2026, 1, 6, 10, 0),
        },
      ],
    },
    {
      institutionId: 'seoul-1',
      posts: [
        {
          authorName: '홍○○ 담당교사님',
          content: '신사초등학교 프로그램 관련 문의가 있어 글 남깁니다. 확인 후 회신 부탁드립니다.',
          read: false,
          viewCount: 3,
          reactionCount: 0,
          commentCount: 0,
          attachmentCount: 0,
          publishedAt: ujatIsoDate(2026, 1, 8, 15, 0),
          createdAt: ujatIsoDate(2026, 1, 8, 15, 0),
          updatedAt: ujatIsoDate(2026, 1, 8, 15, 0),
        },
      ],
    },
  ]

  const posts: ProgramPost[] = []
  institutionPosts.forEach(({ institutionId, posts: rows }) => {
    rows.forEach((row, index) => {
      const publishedAt = row.publishedAt as string
      posts.push({
        id: `post-ujat-${institutionId}-${index + 1}` as UUID,
        programId,
        schoolId: institutionId as UUID,
        ...row,
        publishedAt,
        createdAt: (row.createdAt as string) ?? publishedAt,
        updatedAt: (row.updatedAt as string) ?? publishedAt,
      })
    })
  })

  return posts
}

export const mockProgramPosts: ProgramPost[] = [
  ...buildPosts(),
  ...buildPostsForSchools(),
  ...buildPostsForHSBCGangseo(),
  ...buildPostsForUjatInstitutions(),
]

const byProgramId = new Map<UUID, ProgramPost[]>()
const byProgramAndSchool = new Map<string, ProgramPost[]>()
const byPostId = new Map<UUID, ProgramPost>()
mockProgramPosts.forEach(post => {
  byPostId.set(post.id, post)
  const list = byProgramId.get(post.programId) ?? []
  list.push(post)
  byProgramId.set(post.programId, list)
  if (post.schoolId) {
    const key = `${post.programId}:${post.schoolId}`
    const schoolList = byProgramAndSchool.get(key) ?? []
    schoolList.push(post)
    byProgramAndSchool.set(key, schoolList)
  }
})
byProgramId.forEach(list => list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()))
byProgramAndSchool.forEach(list => list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()))

/** 프로그램 ID로 게시글 목록 조회 (최신순, 프로그램 전체 공지 + 학교별 공지 모두 포함) */
export function getProgramPostsByProgramId(programId: UUID): ProgramPost[] {
  return (byProgramId.get(programId) ?? []).slice()
}

/** 프로그램 + 참여기관(학교) ID로 해당 학교 게시글만 조회 (학교 상세 게시글 탭용) */
export function getProgramPostsByProgramIdAndSchoolId(programId: UUID, schoolId: string): ProgramPost[] {
  const directKey = `${programId}:${schoolId}`
  const direct = byProgramAndSchool.get(directKey) ?? []
  if (direct.length > 0) return direct.slice()
  if (isUjatProgressProgramId(programId)) {
    const canonicalKey = `${UJAT_EDUCATION_IN_PROGRESS_PROGRAM_ID}:${schoolId}`
    return (byProgramAndSchool.get(canonicalKey) ?? []).slice()
  }
  return []
}

export const mockProgramPostsMap = new Map(mockProgramPosts.map(p => [p.id, p]))

/** 게시글 등록 시 사용하는 페이로드 */
export interface CreateProgramPostPayload {
  programId: UUID
  schoolId?: UUID
  authorName: string
  content: string
  /** 공개 범위 (teacher, instructor, student) — 저장용 옵션 */
  audience?: string[]
  attachmentCount: number
}

/** 게시글 등록 (Mock: in-memory 추가 후 목록에 반영) */
export function createProgramPost(payload: CreateProgramPostPayload): ProgramPost {
  const now = new Date().toISOString()
  const id = `post-created-${Date.now()}-${Math.random().toString(36).slice(2, 11)}` as UUID
  const post: ProgramPost = {
    id,
    programId: payload.programId,
    schoolId: payload.schoolId,
    authorName: payload.authorName,
    content: payload.content.trim(),
    read: false,
    viewCount: 0,
    reactionCount: 0,
    commentCount: 0,
    attachmentCount: payload.attachmentCount,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  }

  let programList = byProgramId.get(payload.programId)
  if (!programList) {
    programList = []
    byProgramId.set(payload.programId, programList)
  }
  programList.push(post)
  byPostId.set(post.id, post)
  programList.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  if (payload.schoolId) {
    const key = `${payload.programId}:${payload.schoolId}`
    let schoolList = byProgramAndSchool.get(key)
    if (!schoolList) {
      schoolList = []
      byProgramAndSchool.set(key, schoolList)
    }
    schoolList.push(post)
    schoolList.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  }

  return post
}

/** 게시글 상세 진입 시 읽음 처리 (Mock: in-memory 반영, 목록 재렌더 시 읽음 표시) */
export function markPostAsRead(postId: UUID): void {
  const post = byPostId.get(postId)
  if (post) {
    post.read = true
    /** 조회수는 program-post-reads 집계(getPostViewCountByPostId)와 동기화 — 여기서 증가시키지 않음 */
    post.updatedAt = new Date().toISOString()
  }
}

/** 댓글 등록 시 게시글 commentCount 증가 (Mock: in-memory 반영) */
export function incrementPostCommentCount(postId: UUID): void {
  const post = byPostId.get(postId)
  if (post) {
    post.commentCount = (post.commentCount || 0) + 1
    post.updatedAt = new Date().toISOString()
  }
}
