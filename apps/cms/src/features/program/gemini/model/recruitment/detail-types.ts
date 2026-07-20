import type { GeminiRecruitmentAddFormSnapshot } from '../../lib/recruitment/add-local-save'
import type { GeminiRecruitmentRow } from './types'

export type GeminiRecruitmentDetailFields = Omit<
  GeminiRecruitmentAddFormSnapshot,
  | 'institutionSectionDescription'
  | 'detailSectionDescription'
  | 'applicationPeriodStart'
  | 'applicationPeriodEnd'
  | 'trainingRequestPeriodStart'
  | 'trainingRequestPeriodEnd'
  | 'title'
>

export type GeminiRecruitmentDetail = GeminiRecruitmentRow &
  GeminiRecruitmentDetailFields & {
    createdAt: string
    createdByName: string
    updatedAt: string
    updatedByName: string
  }
