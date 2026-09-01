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
      '최근 과제 제출 과정에서 일부 학생들이 다른 반 친구의 과제를 그대로 따라 쓰거나, 인터넷 자료 또는 GPT와 같은 인공지능 도구의 답변을 충분한 이해 없이 그대로 복사하여 제출하는 사례가 있다는 이야기를 전달받았습니다. 과제는 단순히 정답을 제출하기 위한 활동이 아니라, 수업 시간에 배운 내용을 스스로 정리하고 생각을 확장하며 자신의 힘으로 문제를 해결해보는 중요한 학습 과정입니다. 다른 사람의 결과물을 그대로 베끼거나 인공지능이 작성한 답변을 자신의 생각처럼 제출하는 것은 과제의 의미를 잃게 만들 뿐 아니라, 스스로 성장할 수 있는 기회를 놓치게 하는 행동입니다. 물론 과제를 하다 보면 내용이 어렵거나, 시간이 부족하거나, 어떻게 시작해야 할지 막막할 수 있습니다. 그럴 때 친구와 의견을 나누거나 선생님께 질문하고, 참고 자료나 인공지능 도구의 도움을 받을 수는 있습니다. 하지만 중요한 것은 그 내용을 그대로 가져오는 것이 아니라, 스스로 이해하고 정리한 뒤 자신의 생각과 표현으로 완성하는 것입니다. 틴토고등학교 학생 여러분, 우리는 결과보다 과정의 가치를 소중히 여기는 태도를 가져야 합니다. 조금 부족하더라도 자신의 힘으로 고민하고 작성한 과제는 충분히 의미가 있습니다. 반대로 겉으로 보기에는 완성도가 높아 보여도, 스스로 이해하지 못한 내용을 그대로 제출한 과제는 진정한 배움으로 이어지기 어렵습니다. 앞으로 과제를 제출할 때에는 다른 사람의 과제를 그대로 베끼지 않고, GPT 등 인공지능 도구의 답변도 자신의 생각 없이 그대로 복사하지 않도록 주의해주시기 바랍니다. 도움을 받았다면 반드시 내용을 충분히 이해하고, 자신의 언어로 다시 정리하며, 필요한 경우 참고했다는 사실을 분명히 하는 태도가 필요합니다. 정직하게 배우고, 주도적으로 고민하며, 스스로의 힘으로 성장해가는 학생이 진정으로 멋진 학생입니다. 틴토고등학교 여러분 모두가 책임감 있는 학습 태도를 바탕으로 과제를 성실히 수행하고, 정직하고 주도적인 배움을 실천하는 학생이 되기를 바랍니다. 최근 과제 제출 과정에서 일부 학생들이 다른 반 친구의 과제를 그대로 따라 쓰거나, 인터넷 자료 또는 GPT와 같은 인공지능 도구의 답변을 충분한 이해 없이 그대로 복사하여 제출하는 사례가 있다는 이야기를 전달받았습니다. 과제는 단순히 정답을 제출하기 위한 활동이 아니라, 수업 시간에 배운 내용을 스스로 정리하고 생각을 확장하며 자신의 힘으로 문제를 해결해보는 중요한 학습 과정입니다. 다른 사람의 결과물을 그대로 베끼거나 인공지능이 작성한 답변을 자신의 생각처럼 제출하는 것은 과제의 의미를 잃게 만들 뿐 아니라, 스스로 성장할 수 있는 기회를 놓치게 하는 행동입니다. 물론 과제를 하다 보면 내용이 어렵거나, 시간이 부족하거나, 어떻게 시작해야 할지 막막할 수 있습니다. 그럴 때 친구와 의견을 나누거나 선생님께 질문하고, 참고 자료나 인공지능 도구의 도움을 받을 수는 있습니다. 하지만 중요한 것은 그 내용을 그대로 가져오는 것이 아니라, 스스로 이해하고 정리한 뒤 자신의 생각과 표현으로 완성하는 것입니다. 틴토고등학교 학생 여러분, 우리는 결과보다 과정의 가치를 소중히 여기는 태도를 가져야 합니다. 조금 부족하더라도 자신의 힘으로 고민하고 작성한 과제는 충분히 의미가 있습니다. 반대로 겉으로 보기에는 완성도가 높아 보여도, 스스로 이해하지 못한 내용을 그대로 제출한 과제는 진정한 배움으로 이어지기 어렵습니다. 앞으로 과제를 제출할 때에는 다른 사람의 과제를 그대로 베끼지 않고, GPT 등 인공지능 도구의 답변도 자신의 생각 없이 그대로 복사하지 않도록 주의해주시기 바랍니다. 도움을 받았다면 반드시 내용을 충분히 이해하고, 자신의 언어로 다시 정리하며, 필요한 경우 참고했다는 사실을 분명히 하는 태도가 필요합니다. 정직하게 배우고, 주도적으로 고민하며, 스스로의 힘으로 성장해가는 학생이 진정으로 멋진 학생입니다. 틴토고등학교 여러분 모두가 책임감 있는 학습 태도를 바탕으로 과제를 성실히 수행하고, 정직하고 주도적인 배움을 실천하는 학생이 되기를 바랍니다.',
    authorName: '박재희 담당교사님',
    publishedAt: '2026-01-15T15:00:00',
    read: false,
    viewCount: 12,
    commentCount: 2,
    reactionCount: 10,
    isAuthor: true,
  },
  {
    id: 'edu-notice-002',
    title:
      '2회차 강의 테마는 "나를 보여주는 기술"입니다. 면접 태도와 모의 면접을 다룰 예정이니 교재를 꼭 준비해 주세요.',
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
    fileName: '(2026) JA Korea 경제금융교육 커리큘럼.pdf',
    uploadedAt: '2026-01-15T10:00:00',
    fileSizeBytes: 18 * 1024 * 1024,
    postId: 'edu-notice-001',
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
    postId: 'edu-notice-002',
  },
]

/** 진행중 상세에서 목록이 보이도록 동일 시드 반환. API 연동 시 programId로 교체. */
export function getMockEducationInProgressNotices(_programId: string): EducationInProgressNotice[] {
  if (!shouldUsePlatformMockData()) return []
  return MOCK_NOTICES.map(notice => ({ ...notice }))
}

export function getMockEducationInProgressFiles(_programId: string): EducationInProgressFile[] {
  if (!shouldUsePlatformMockData()) return []
  return MOCK_FILES.map(file => ({ ...file }))
}
