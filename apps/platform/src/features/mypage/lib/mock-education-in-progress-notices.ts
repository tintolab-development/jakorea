import type {
  EducationInProgressFile,
  EducationInProgressNotice,
} from '../model/education-in-progress-notice-types'
import { shouldUsePlatformMockData } from '@/shared/lib/dev-auth'

const MOCK_NOTICES: EducationInProgressNotice[] = [
  {
    id: 'edu-notice-001',
    title:
      '최근 과제 제출 시 다른 반 친구의 과제를 그대로 카피하거나 GPT의 답변을 그대로 복사하여 제출하는 경우가 많다고 전달받았습니다.',
    content:
      '최근 과제 제출과 관련하여 다른 반 친구의 과제를 그대로 베끼거나, GPT 등에 답을 맡기는 사례가 많다는 소식을 전해 들었습니다.\n과제를 스스로 성실히 수행하는 학생이 되어 주시기 바랍니다. 타인의 글을 베끼거나 대신 작성한 것으로 확인되는 과제는 0점 처리하며 재제출이 필요합니다.',
    authorName: '박제희 담당교사님',
    publishedAt: '2026-01-15T15:00:00',
    read: false,
    viewCount: 12,
    commentCount: 2,
    reactionCount: 10,
  },
  {
    id: 'edu-notice-002',
    title: '2회차 강의 테마는 "나를 보여주는 기술"입니다. 면접 태도와 모의 면접을 다룰 예정이니 교재를 꼭 준비해 주세요.',
    content:
      '2회차 강의의 테마는 "나를 보여주는 기술"입니다. 면접 태도와 모의 면접을 다룰 예정이오니 교재를 꼭 준비해 주시고, 이번 주까지 과제 제출 부탁드립니다.',
    authorName: '김틴토 강사님',
    publishedAt: '2026-01-10T10:00:00',
    read: false,
    viewCount: 12,
    commentCount: 2,
    reactionCount: 10,
  },
  {
    id: 'edu-notice-003',
    title: '1회차 수업 하루 전입니다. 내일 진행될 단원 내용을 미리 준비해 주시기 바랍니다.',
    content:
      '1회차 수업 하루 전입니다. 내일 진행될 단원 내용을 미리 준비해 주시기 바랍니다! 교재와 필기도구를 꼭 챙겨 주세요.',
    authorName: 'JA KOREA 알림',
    publishedAt: '2026-01-05T10:00:00',
    read: true,
    viewCount: 12,
    commentCount: 2,
    reactionCount: 10,
  },
]

const MOCK_FILES: EducationInProgressFile[] = [
  {
    id: 'edu-file-001',
    fileName: '(2026) JA Korea 경제금융교육 강사단 지침 및 일정표',
    uploadedAt: '2026-01-15T10:00:00',
    fileSizeBytes: 18 * 1024 * 1024,
    postId: 'edu-notice-002',
  },
  {
    id: 'edu-file-002',
    fileName: '강사 대기실 변경 안내도_기존 대기실',
    uploadedAt: '2026-01-15T10:00:00',
    fileSizeBytes: 18 * 1024 * 1024,
    postId: 'edu-notice-002',
  },
  {
    id: 'edu-file-003',
    fileName: '참여학교_학급별_교육일정_2026_1학기',
    uploadedAt: '2026-01-10T10:00:00',
    fileSizeBytes: 4 * 1024 * 1024,
    postId: 'edu-notice-001',
  },
]

/** 진행중 상세에서 목록이 보이도록 동일 시드 반환. API 연동 시 programId로 교체. */
export function getMockEducationInProgressNotices(
  _programId: string,
): EducationInProgressNotice[] {
  if (!shouldUsePlatformMockData()) return []
  return MOCK_NOTICES
}

export function getMockEducationInProgressFiles(_programId: string): EducationInProgressFile[] {
  if (!shouldUsePlatformMockData()) return []
  return MOCK_FILES
}
