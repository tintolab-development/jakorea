import type { GeminiRecruitmentEducationStructure } from '../../lib/recruitment/add-form-options'
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
  | 'educationStructure'
> & {
  /** GET null이면 PATCH에 educationStructure를 보내지 않는다. */
  educationStructure: GeminiRecruitmentEducationStructure | null
}

export type GeminiRecruitmentDetail = GeminiRecruitmentRow &
  GeminiRecruitmentDetailFields & {
    createdAt: string
    createdByName: string
    updatedAt: string
    updatedByName: string
  }
