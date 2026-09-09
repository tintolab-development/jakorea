import { DEFAULT_SURVEY_PARAGRAPH_IDS } from '@/features/template/model/writing-form-draft.schema'
import type { SurveyPollRawResponse } from '@/features/program/shared/lib/survey-management/survey-management-types'

const P = DEFAULT_SURVEY_PARAGRAPH_IDS

export const GENERAL_ORGANIZATION_SURVEY_RESPONSES_MOCK: SurveyPollRawResponse[] = [
  {
    respondentId: 'general-org-survey-respondent-01',
    respondentName: '김민지 교사',
    addressRegion: '서울특별시 강남구',
    answers: {
      [P.score]: 'multiple-choice-item-1',
      [P.score2]: 'scale-type-item-4',
      [P.score3]: 'scale-type-item-5',
      [P.score4]: 'scale-type-item-4',
      [P.score5]: 'scale-type-item-5',
      [P.score6]: 'scale-type-item-4',
      [P.score7]: 'scale-type-item-5',
      [P.subjective]: '운영 일정이 조금 더 여유로웠으면 합니다.',
      [P.subjective2]: '활동 중심으로 이해하기 쉬웠습니다.',
      [P.subjective3]: '진로 탐색 콘텐츠가 더 필요합니다.',
      [P.star]: '5',
    },
  },
  {
    respondentId: 'general-org-survey-respondent-02',
    respondentName: '이하늘 학생',
    addressRegion: '서울특별시 마포구',
    answers: {
      [P.score]: 'multiple-choice-item-2',
      [P.score2]: 'scale-type-item-5',
      [P.score3]: 'scale-type-item-4',
      [P.score4]: 'scale-type-item-5',
      [P.score5]: 'scale-type-item-5',
      [P.score6]: 'scale-type-item-4',
      [P.score7]: 'scale-type-item-5',
      [P.subjective]: '실습 시간이 더 길었으면 좋겠습니다.',
      [P.subjective2]: '팀 활동이 재미있고 도움이 됐어요.',
      [P.subjective3]: '경제 기초 콘텐츠가 필요합니다.',
      [P.star]: '5',
    },
  },
  {
    respondentId: 'general-org-survey-respondent-03',
    respondentName: '박준호 교사',
    addressRegion: '경기도 성남시',
    answers: {
      [P.score]: 'multiple-choice-item-2',
      [P.score2]: 'scale-type-item-4',
      [P.score3]: 'scale-type-item-4',
      [P.score4]: 'scale-type-item-5',
      [P.score5]: 'scale-type-item-4',
      [P.score6]: 'scale-type-item-4',
      [P.score7]: 'scale-type-item-4',
      [P.subjective]: '사전 자료가 더 일찍 공유되면 좋겠습니다.',
      [P.subjective2]: '커리큘럼과 진행이 안정적이었습니다.',
      [P.subjective3]: '교사 연수 콘텐츠가 필요합니다.',
      [P.star]: '4',
    },
  },
  {
    respondentId: 'general-org-survey-respondent-04',
    respondentName: '최서연 학생',
    addressRegion: '인천광역시 연수구',
    answers: {
      [P.score]: 'multiple-choice-item-1',
      [P.score2]: 'scale-type-item-5',
      [P.score3]: 'scale-type-item-5',
      [P.score4]: 'scale-type-item-4',
      [P.score5]: 'scale-type-item-5',
      [P.score6]: 'scale-type-item-5',
      [P.score7]: 'scale-type-item-5',
      [P.subjective]: '안내 문구를 더 쉽게 써 주세요.',
      [P.subjective2]: '직업 체험 사례가 기억에 남았습니다.',
      [P.subjective3]: '직업 탐색 콘텐츠가 필요합니다.',
      [P.star]: '5',
    },
  },
]

export const GENERAL_INDIVIDUAL_SURVEY_RESPONSES_MOCK: SurveyPollRawResponse[] = [
  {
    respondentId: 'general-ind-survey-respondent-01',
    respondentName: '정유진',
    addressRegion: '부산광역시 해운대구',
    answers: {
      [P.score]: 'multiple-choice-item-1',
      [P.score2]: 'scale-type-item-4',
      [P.score3]: 'scale-type-item-4',
      [P.score4]: 'scale-type-item-5',
      [P.score5]: 'scale-type-item-4',
      [P.score6]: 'scale-type-item-3',
      [P.score7]: 'scale-type-item-4',
      [P.subjective]: '온라인 사전 안내가 더 자세하면 좋겠습니다.',
      [P.subjective2]: '혼자 신청해도 따라가기 쉬웠습니다.',
      [P.subjective3]: '개인 참가자용 콘텐츠가 필요합니다.',
      [P.star]: '4',
    },
  },
  {
    respondentId: 'general-ind-survey-respondent-02',
    respondentName: '한도윤',
    addressRegion: '대전광역시 서구',
    answers: {
      [P.score]: 'multiple-choice-item-2',
      [P.score2]: 'scale-type-item-4',
      [P.score3]: 'scale-type-item-3',
      [P.score4]: 'scale-type-item-4',
      [P.score5]: 'scale-type-item-4',
      [P.score6]: 'scale-type-item-4',
      [P.score7]: 'scale-type-item-5',
      [P.subjective]: '후속 프로그램 안내를 받고 싶습니다.',
      [P.subjective2]: '활동 흐름이 명확했습니다.',
      [P.subjective3]: '후속 심화 콘텐츠가 필요합니다.',
      [P.star]: '4',
    },
  },
  {
    respondentId: 'general-ind-survey-respondent-03',
    respondentName: '송지아',
    addressRegion: '광주광역시 북구',
    answers: {
      [P.score]: 'multiple-choice-item-1',
      [P.score2]: 'scale-type-item-5',
      [P.score3]: 'scale-type-item-5',
      [P.score4]: 'scale-type-item-5',
      [P.score5]: 'scale-type-item-4',
      [P.score6]: 'scale-type-item-5',
      [P.score7]: 'scale-type-item-5',
      [P.subjective]: '질문 시간이 더 길었으면 합니다.',
      [P.subjective2]: '실제 사례 중심이라 몰입도가 높았습니다.',
      [P.subjective3]: '사례 기반 콘텐츠가 필요합니다.',
      [P.star]: '5',
    },
  },
]

export const GENERAL_ORGANIZATION_SURVEY_RESPONSE_COUNT =
  GENERAL_ORGANIZATION_SURVEY_RESPONSES_MOCK.length

export const GENERAL_INDIVIDUAL_SURVEY_RESPONSE_COUNT =
  GENERAL_INDIVIDUAL_SURVEY_RESPONSES_MOCK.length
