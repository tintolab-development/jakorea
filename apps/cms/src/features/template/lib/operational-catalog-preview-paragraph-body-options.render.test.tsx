// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { createApplicantRecruitFormIndividualDraft } from '@/features/template/model/applicant-recruit-form-individual-draft'
import { createApplicantRecruitFormInstitutionDraft } from '@/features/template/model/applicant-recruit-form-institution-draft'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { HorizontalTableParagraphBody } from '@/features/template/ui/paragraph/table/horizontal-table-paragraph-body'
import { resolveOperationalCatalogPreviewParagraphBodyOptions } from './operational-catalog-preview-paragraph-body-options'

const EMPTY_CELL_PLACEHOLDER = '텍스트를 입력해 주세요'

function firstHorizontalParagraph(draft: {
  paragraphs: readonly { id: string }[]
}): HorizontalTableParagraph {
  return draft.paragraphs[0] as HorizontalTableParagraph
}

describe('operational catalog picker preview bodies', () => {
  afterEach(cleanup)

  it('renders individual recruit field labels instead of empty table placeholders', () => {
    const paragraph = firstHorizontalParagraph(createApplicantRecruitFormIndividualDraft())
    const options = resolveOperationalCatalogPreviewParagraphBodyOptions(
      'recruitment-participant-individual'
    )
    const { getByText, queryByText } = render(
      <HorizontalTableParagraphBody
        paragraph={paragraph}
        onChange={() => {}}
        isEditMode={false}
        applicantRecruitFormIndividual={options?.applicantRecruitFormIndividual}
      />
    )
    expect(getByText('공고 게시 여부')).toBeTruthy()
    expect(queryByText(EMPTY_CELL_PLACEHOLDER)).toBeNull()
  })

  it('falls back to empty table placeholders when specialized flags are off', () => {
    const paragraph = firstHorizontalParagraph(createApplicantRecruitFormIndividualDraft())
    const { getAllByText } = render(
      <HorizontalTableParagraphBody
        paragraph={paragraph}
        onChange={() => {}}
        isEditMode={false}
      />
    )
    expect(getAllByText(EMPTY_CELL_PLACEHOLDER).length).toBeGreaterThan(0)
  })

  it('renders institution recruit specialized body with catalog preview flags', () => {
    const paragraph = firstHorizontalParagraph(createApplicantRecruitFormInstitutionDraft())
    const options = resolveOperationalCatalogPreviewParagraphBodyOptions(
      'recruitment-participant-school'
    )
    const { getByText, queryByText } = render(
      <HorizontalTableParagraphBody
        paragraph={paragraph}
        onChange={() => {}}
        isEditMode={false}
        applicantRecruitFormInstitution={options?.applicantRecruitFormInstitution}
        showInstitutionApplicationLimits={options?.showInstitutionApplicationLimits}
        applicantRecruitInstitutionTemplateAuthoringMode={
          options?.applicantRecruitInstitutionTemplateAuthoringMode
        }
      />
    )
    expect(getByText('참여자 모집 현황')).toBeTruthy()
    expect(queryByText(EMPTY_CELL_PLACEHOLDER)).toBeNull()
  })
})
