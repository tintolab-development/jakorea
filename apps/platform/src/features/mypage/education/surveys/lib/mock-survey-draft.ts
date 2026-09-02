import {
  createDefaultScaleTypeItems,
  createParagraphByDetail,
  normalizeWritingFormDraft,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'

export const EDUCATION_SURVEY_MOCK_PARAGRAPH_IDS = {
  title: 'edu-survey-title',
  user: 'edu-survey-user',
  multipleChoice: 'edu-survey-mc',
  scaleType: 'edu-survey-scale',
  shortEssay: 'edu-survey-essay',
  starRate: 'edu-survey-star',
  date: 'edu-survey-date',
  time: 'edu-survey-time',
  fileAttachment: 'edu-survey-file',
  closing: 'edu-survey-closing',
} as const

const MULTIPLE_CHOICE_OPTIONS = [
  { id: 'edu-survey-mc-1', label: '학교·기관 추천' },
  { id: 'edu-survey-mc-2', label: '친구·지인 추천' },
  { id: 'edu-survey-mc-3', label: 'JA Korea 홈페이지·SNS' },
  { id: 'edu-survey-mc-4', label: '검색·뉴스·기사' },
  { id: 'edu-survey-mc-5', label: '기타' },
] as const

/** 교육현황 설문조사 탭 mock — CMS 설문 단락 8종 + 제목·설문자정보·마무리 */
export function createEducationSurveyMockDraft(): WritingFormDraft {
  const scaleItems = createDefaultScaleTypeItems()

  const paragraphs: WritingFormParagraph[] = [
    {
      ...createParagraphByDetail('title', EDUCATION_SURVEY_MOCK_PARAGRAPH_IDS.title),
      surveyTitle: '2026년 개선방향을 위한 설문조사',
      surveyDescription: 'JA Korea의 성장을 위해 회원님의 소중한 의견을 보내주세요.',
      periodMode: 'custom',
      startAt: '2026-08-05',
      endAt: '2026-08-12',
      showWritingPeriodOnForm: true,
    } as WritingFormParagraph,
    {
      ...createParagraphByDetail('user_info', EDUCATION_SURVEY_MOCK_PARAGRAPH_IDS.user),
      paragraphTitle: '설문자 정보',
      paragraphDescription: '선택한 항목을 자동으로 불러옵니다.',
      selectedUserFieldKeys: ['name', 'programName', 'period'],
    } as WritingFormParagraph,
    {
      ...createParagraphByDetail('multiple_choice', EDUCATION_SURVEY_MOCK_PARAGRAPH_IDS.multipleChoice),
      paragraphTitle: '프로그램 신청 계기 (중복 선택 가능)',
      paragraphDescription: '해당하는 항목을 모두 선택해 주세요.',
      allowMultiple: true,
      items: MULTIPLE_CHOICE_OPTIONS.map(item => ({ ...item })),
      selectedPreviewSingleId: null,
      selectedPreviewMultipleIds: [],
    } as WritingFormParagraph,
    {
      ...createParagraphByDetail('scale_type', EDUCATION_SURVEY_MOCK_PARAGRAPH_IDS.scaleType),
      paragraphTitle: '프로그램 홍보 날짜 및 시간이 적절하였나요?',
      paragraphDescription: '해당하는 항목을 선택해 주세요.',
      items: scaleItems,
      selectedPreviewItemId: null,
    } as WritingFormParagraph,
    {
      ...createParagraphByDetail('subjective', EDUCATION_SURVEY_MOCK_PARAGRAPH_IDS.shortEssay),
      paragraphTitle: '본 프로그램에서 개선했으면 하는 사항 혹은 좋았던 사항에 대해서 기재해 주세요',
      paragraphDescription: '자유롭게 기재하여 주십시오.',
      bodyPlaceholder: '질문을 입력해 주세요',
      bodyText: '',
      items: [
        {
          id: 'edu-survey-essay-item-1',
          label: '',
          placeholder: '질문을 입력해 주세요',
          bodyText: '',
        },
      ],
    } as WritingFormParagraph,
    {
      ...createParagraphByDetail('star_rate', EDUCATION_SURVEY_MOCK_PARAGRAPH_IDS.starRate),
      paragraphTitle: '프로그램 추천 여부 만족도를 선택해 주세요!',
      paragraphDescription: '별점을 선택하여 기재해 주세요.',
      selectedPreviewStars: null,
    } as WritingFormParagraph,
    {
      ...createParagraphByDetail('date_only', EDUCATION_SURVEY_MOCK_PARAGRAPH_IDS.date),
      paragraphTitle: '참여 희망 일정',
      paragraphDescription: '날짜를 선택해 주세요.',
      periodEnabled: false,
    } as WritingFormParagraph,
    {
      ...createParagraphByDetail('time_only', EDUCATION_SURVEY_MOCK_PARAGRAPH_IDS.time),
      paragraphTitle: '연락 가능 시간',
      paragraphDescription: '시간을 선택해 주세요.',
    } as WritingFormParagraph,
    {
      ...createParagraphByDetail('file_attachment', EDUCATION_SURVEY_MOCK_PARAGRAPH_IDS.fileAttachment),
      paragraphTitle: '참고 자료 첨부',
      paragraphDescription: '필요 시 파일을 첨부해 주세요.',
    } as WritingFormParagraph,
    {
      ...createParagraphByDetail('closing', EDUCATION_SURVEY_MOCK_PARAGRAPH_IDS.closing),
      body: '설문에 참여해 주셔서 감사합니다.',
    } as WritingFormParagraph,
  ]

  return normalizeWritingFormDraft({
    schemaVersion: 1,
    formSettings: { titleNumbering: 'q123' },
    paragraphs,
  })
}
