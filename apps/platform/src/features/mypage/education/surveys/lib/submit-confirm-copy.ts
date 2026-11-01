import type { EducationSurveySeedKind } from './seed-survey-draft'

export type EducationSurveySubmitConfirmCopy = {
  title: string
  description: string
}

export function educationSurveySubmitConfirmCopy(
  kind: EducationSurveySeedKind,
): EducationSurveySubmitConfirmCopy {
  if (kind === 'satisfaction') {
    return {
      title: '만족도조사 응답을 제출할까요?',
      description: '내용을 확인한 뒤 제출해 주세요.',
    }
  }
  return {
    title: '설문 응답을 제출할까요?',
    description: '내용을 확인한 뒤 제출해 주세요.',
  }
}
