import type { ReactNode } from 'react'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { GEMINI_VISITING_TRAINING_RECRUIT_FORM_IDS } from '@/features/template/model/gemini-visiting-training-recruit-form-draft'
import { GeminiRecruitInstitutionInfoParagraph } from '@/features/template/ui/form-set/recruit-form/gemini/paragraphs/gemini-recruit-institution-info-paragraph'
import { RecruitDetailInfoParagraph } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-paragraph'

/** 템플릿 편집기 — Gemini 찾아가는 연수 모집 폼 시드 단락 본문 */
export function renderGeminiRecruitFormParagraphBody(
  paragraph: HorizontalTableParagraph,
  enabled: boolean | undefined
): ReactNode | null {
  if (!enabled) return null
  switch (paragraph.id) {
    case GEMINI_VISITING_TRAINING_RECRUIT_FORM_IDS.recruitInfo:
      return <GeminiRecruitInstitutionInfoParagraph />
    case GEMINI_VISITING_TRAINING_RECRUIT_FORM_IDS.detailInfo:
      return (
        <RecruitDetailInfoParagraph
          wysiwygResetKey="gemini-recruit-extra-body"
          overlayKeyPrefix="geminiRecruit.detailInfo"
          textFields={[
            { label: '프로그램 설명', placeholder: '프로그램 설명을 작성하세요' },
            { label: '모집 안내', placeholder: '모집 안내를 작성하세요' },
            { label: '지원 방법', placeholder: '지원 방법을 작성하세요' },
            { label: '학습 지원 내용', placeholder: '학습 지원 내용을 작성하세요' },
          ]}
        />
      )
    default:
      return null
  }
}
