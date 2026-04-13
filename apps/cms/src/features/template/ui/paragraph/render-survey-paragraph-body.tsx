import type { SurveyParagraph } from '@/features/template/model/survey-draft.schema'
import { SurveyClosingBody } from '@/features/template/ui/paragraph/explanation/closing-paragraph-body'
import { ExplanationTitle } from '@/features/template/ui/paragraph/explanation/title'
import { SurveyScoreSelectBody } from '@/features/template/ui/paragraph/single-item/score-select-paragraph-body'
import { SurveySubjectiveBody } from '@/features/template/ui/paragraph/single-item/subjective-paragraph-body'
import { SurveyUserProfileBody } from '@/features/template/ui/paragraph/single-item/user-profile-paragraph-body'

export type SurveyUpdateParagraph = (
  id: string,
  updater: (p: SurveyParagraph) => SurveyParagraph
) => void

export function renderSurveyParagraphBody(
  p: SurveyParagraph,
  updateParagraph: SurveyUpdateParagraph,
  isParagraphSelected: boolean
) {
  switch (p.variant) {
    case 'survey_title_with_period':
      return (
        <ExplanationTitle
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isParagraphSelected}
        />
      )
    case 'user_profile':
      return (
        <SurveyUserProfileBody
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isParagraphSelected}
        />
      )
    case 'score_select':
      return (
        <SurveyScoreSelectBody
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isParagraphSelected}
        />
      )
    case 'subjective':
      return <SurveySubjectiveBody paragraph={p} isEditMode={isParagraphSelected} />
    case 'closing':
      return (
        <SurveyClosingBody paragraph={p} onChange={next => updateParagraph(p.id, () => next)} isEditMode={isParagraphSelected} />
      )
  }
}
