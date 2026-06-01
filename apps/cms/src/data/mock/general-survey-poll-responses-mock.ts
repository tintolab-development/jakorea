import { DEFAULT_SURVEY_PARAGRAPH_IDS } from '@/features/template/model/writing-form-draft.schema'
import type { SurveyPollRawResponse } from '@/features/program/shared/lib/survey-management/survey-management-types'

const P = DEFAULT_SURVEY_PARAGRAPH_IDS

export const GENERAL_ORGANIZATION_SURVEY_RESPONSES_MOCK: SurveyPollRawResponse[] = [
  {
    respondentId: 'general-org-survey-respondent-01',
    respondentName: '김민지 교사',
    addressRegion: '서울특별시 강남구',
    answers: {
      [P.score]: 'scale-type-item-5',
      [P.score2]: 'scale-type-item-4',
      [P.subjective]: '학생들이 경제 개념을 활동으로 이해할 수 있어 좋았습니다.',
      [P.subjective2]: '기관별 운영 일정 안내가 조금 더 빨랐으면 합니다.',
    },
  },
  {
    respondentId: 'general-org-survey-respondent-02',
    respondentName: '이하늘 학생',
    addressRegion: '서울특별시 마포구',
    answers: {
      [P.score]: 'scale-type-item-4',
      [P.score2]: 'scale-type-item-5',
      [P.subjective]: '팀 활동이 재미있었고 진로 선택에 도움이 됐어요.',
      [P.subjective2]: '다음에는 실습 시간이 더 길었으면 좋겠습니다.',
    },
  },
  {
    respondentId: 'general-org-survey-respondent-03',
    respondentName: '박준호 교사',
    addressRegion: '경기도 성남시',
    answers: {
      [P.score]: 'scale-type-item-4',
      [P.score2]: 'scale-type-item-4',
      [P.subjective]: '커리큘럼과 강사 진행이 안정적이었습니다.',
      [P.subjective2]: '사전 자료가 잘 정리되어 있어 수업 준비가 쉬웠습니다.',
    },
  },
  {
    respondentId: 'general-org-survey-respondent-04',
    respondentName: '최서연 학생',
    addressRegion: '인천광역시 연수구',
    answers: {
      [P.score]: 'scale-type-item-5',
      [P.score2]: 'scale-type-item-5',
      [P.subjective]: '직업 체험 사례가 기억에 남았습니다.',
      [P.subjective2]: '친구들에게 추천하고 싶습니다.',
    },
  },
]

export const GENERAL_INDIVIDUAL_SURVEY_RESPONSES_MOCK: SurveyPollRawResponse[] = [
  {
    respondentId: 'general-ind-survey-respondent-01',
    respondentName: '정유진',
    addressRegion: '부산광역시 해운대구',
    answers: {
      [P.score]: 'scale-type-item-5',
      [P.score2]: 'scale-type-item-4',
      [P.subjective]: '개인 참가자도 따라가기 쉬운 구성이라 좋았습니다.',
      [P.subjective2]: '온라인 사전 안내가 더 자세하면 좋겠습니다.',
    },
  },
  {
    respondentId: 'general-ind-survey-respondent-02',
    respondentName: '한도윤',
    addressRegion: '대전광역시 서구',
    answers: {
      [P.score]: 'scale-type-item-4',
      [P.score2]: 'scale-type-item-4',
      [P.subjective]: '혼자 신청했지만 활동 흐름이 명확했습니다.',
      [P.subjective2]: '후속 프로그램 안내도 받고 싶습니다.',
    },
  },
  {
    respondentId: 'general-ind-survey-respondent-03',
    respondentName: '송지아',
    addressRegion: '광주광역시 북구',
    answers: {
      [P.score]: 'scale-type-item-5',
      [P.score2]: 'scale-type-item-5',
      [P.subjective]: '실제 사례 중심이라 몰입도가 높았습니다.',
      [P.subjective2]: '질문 시간이 충분해서 좋았습니다.',
    },
  },
]

export const GENERAL_ORGANIZATION_SURVEY_RESPONSE_COUNT =
  GENERAL_ORGANIZATION_SURVEY_RESPONSES_MOCK.length

export const GENERAL_INDIVIDUAL_SURVEY_RESPONSE_COUNT =
  GENERAL_INDIVIDUAL_SURVEY_RESPONSES_MOCK.length
