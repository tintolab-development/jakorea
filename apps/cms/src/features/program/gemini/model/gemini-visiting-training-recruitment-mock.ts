import type { GeminiVisitingTrainingRecruitmentRow } from './gemini-visiting-training-types'

/** 모집 공고 목록 mock — 상태별 1건 */
export const mockGeminiVisitingTrainingRecruitmentRows: GeminiVisitingTrainingRecruitmentRow[] =
  [
    {
      id: 'gvt-recruitment-scheduled',
      displayNo: 215,
      title: '(Google for Education & JA Korea)Gemini Academy Coding Bootcamp',
      applicationPeriodStart: '2026-06-10',
      applicationPeriodEnd: '2026-06-25',
      trainingRequestPeriodStart: '2026-09-10',
      trainingRequestPeriodEnd: '2026-09-25',
      status: 'SCHEDULED',
    },
    {
      id: 'gvt-recruitment-in-progress',
      displayNo: 213,
      title: '(Google for Education & JA Korea)Gemini Academy STEAM Education Workshop',
      applicationPeriodStart: '2026-06-10',
      applicationPeriodEnd: '2026-06-25',
      trainingRequestPeriodStart: '2026-09-10',
      trainingRequestPeriodEnd: '2026-09-25',
      status: 'IN_PROGRESS',
    },
    {
      id: 'gvt-recruitment-ended',
      displayNo: 207,
      title: '(Google for Education & JA Korea)Gemini Academy AI for Education Workshop',
      applicationPeriodStart: '2026-06-10',
      applicationPeriodEnd: '2026-06-25',
      trainingRequestPeriodStart: '2026-09-10',
      trainingRequestPeriodEnd: '2026-09-25',
      status: 'ENDED',
    },
  ]
