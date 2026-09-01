import { DEFAULT_SURVEY_PARAGRAPH_IDS } from '@/features/template/model/writing-form-draft.schema'

const P = DEFAULT_SURVEY_PARAGRAPH_IDS

export type UjatSurveyPollRawResponse = {
  respondentId: string
  respondentName: string
  addressRegion: string
  answers: Record<string, string>
}

/** survey-default 양식 기준 10명 목응답 (Q2/Q3 척도 + Q4/Q5 주관식) */
export const UJAT_SURVEY_POLL_RESPONSES_MOCK: UjatSurveyPollRawResponse[] = [
  {
    respondentId: 'ujat-survey-respondent-01',
    respondentName: '이수진',
    addressRegion: '서울특별시 강서구',
    answers: {
      [P.score]: 'scale-type-item-1',
      [P.score2]: 'scale-type-item-3',
      [P.subjective]: '다음에는 더 긴 버전을 기대하고 있어요!',
      [P.subjective2]: '워크숍 진행 속도가 적당했습니다.',
    },
  },
  {
    respondentId: 'ujat-survey-respondent-02',
    respondentName: '박지현',
    addressRegion: '경기도 성남시',
    answers: {
      [P.score]: 'scale-type-item-2',
      [P.score2]: 'scale-type-item-2',
      [P.subjective]: '내용이 흥미로웠고, 배운 점이 많았습니다.',
      [P.subjective2]: '강의 자료가 이해하기 쉬웠어요.',
    },
  },
  {
    respondentId: 'ujat-survey-respondent-03',
    respondentName: '최영수',
    addressRegion: '인천광역시 남동구',
    answers: {
      [P.score]: 'scale-type-item-3',
      [P.score2]: 'scale-type-item-2',
      [P.subjective]: '참여하게 되어 정말 기뻤습니다!',
      [P.subjective2]: '질의응답 시간이 조금 더 있었으면 좋겠습니다.',
    },
  },
  {
    respondentId: 'ujat-survey-respondent-04',
    respondentName: '정민호',
    addressRegion: '대전광역시 서구',
    answers: {
      [P.score]: 'scale-type-item-3',
      [P.score2]: 'scale-type-item-3',
      [P.subjective]: '다양한 주제를 다뤄줘서 좋았어요.',
      [P.subjective2]: '실습 비중을 늘려주시면 더 좋을 것 같아요.',
    },
  },
  {
    respondentId: 'ujat-survey-respondent-05',
    respondentName: '한지혜',
    addressRegion: '부산광역시 해운대구',
    answers: {
      [P.score]: 'scale-type-item-4',
      [P.score2]: 'scale-type-item-3',
      [P.subjective]: '친구들에게 추천하고 싶은 프로그램입니다.',
      [P.subjective2]: '전반적으로 만족스러웠습니다.',
    },
  },
  {
    respondentId: 'ujat-survey-respondent-06',
    respondentName: '송민서',
    addressRegion: '광주광역시 북구',
    answers: {
      [P.score]: 'scale-type-item-4',
      [P.score2]: 'scale-type-item-4',
      [P.subjective]: '앞으로도 이런 기회가 많았으면 좋겠어요.',
      [P.subjective2]: '강사님 설명이 명확하고 친절했습니다.',
    },
  },
  {
    respondentId: 'ujat-survey-respondent-07',
    respondentName: '배상훈',
    addressRegion: '전북특별자치도 전주시',
    answers: {
      [P.score]: 'scale-type-item-4',
      [P.score2]: 'scale-type-item-4',
      [P.subjective]: '짧은 시간이었지만, 유익한 시간이었습니다.',
      [P.subjective2]: '교육 일정 안내가 잘 되어 있었습니다.',
    },
  },
  {
    respondentId: 'ujat-survey-respondent-08',
    respondentName: '은하늘',
    addressRegion: '대구광역시 수성구',
    answers: {
      [P.score]: 'scale-type-item-4',
      [P.score2]: 'scale-type-item-4',
      [P.subjective]: '프로그램 구성과 진행 방식이 인상적이었습니다.',
      [P.subjective2]: '온라인 자료 공유가 도움이 되었어요.',
    },
  },
  {
    respondentId: 'ujat-survey-respondent-09',
    respondentName: '김도윤',
    addressRegion: '서울특별시 마포구',
    answers: {
      [P.score]: 'scale-type-item-5',
      [P.score2]: 'scale-type-item-5',
      [P.subjective]: '진로 탐색에 큰 도움이 되었습니다.',
      [P.subjective2]: '다음 회차에도 참여하고 싶습니다.',
    },
  },
  {
    respondentId: 'ujat-survey-respondent-10',
    respondentName: '홍서연',
    addressRegion: '경기도 수원시',
    answers: {
      [P.score]: 'scale-type-item-5',
      [P.score2]: 'scale-type-item-5',
      [P.subjective]: '팀 활동이 재미있고 배울 점이 많았어요.',
      [P.subjective2]: '프로그램 운영에 감사드립니다.',
    },
  },
]

export const UJAT_SURVEY_POLL_MOCK_RESPONSE_COUNT = UJAT_SURVEY_POLL_RESPONSES_MOCK.length
