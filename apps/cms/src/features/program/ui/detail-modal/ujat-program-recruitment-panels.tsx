import type { ReactNode } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/model/program-detail-edit-schema'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { renderUjatRecruitFormInstitutionParagraphBody } from '@/features/template/ui/form-set/recruit-form/UJAT-institution/paragraph-body'
import { renderUjatRecruitFormVolunteerParagraphBody } from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/paragraph-body'
import { getVisibleParagraphDescription } from '@/features/template/lib/writing-form-paragraph-description'
import { getUjatRecruitInstitutionDraft, getUjatRecruitVolunteerDraft } from './ujat-recruit-template-draft'
import {
  type UjatRecruitParagraphProps,
  resolveUjatRecruitParagraphMode,
} from './ujat-recruit-paragraph-props'
import type { UjatRecruitTabKey } from './ujat-program-detail-recruitment-tabs'
import { volunteerHalfFromRecruitTab } from './ujat-program-detail-recruitment-tabs'
import '@/features/program/program-detail/ui/project-info/project-info-form-shared.css'
import './ujat-program-recruitment.css'

function paragraphRenderOptions(
  base: Omit<UjatRecruitParagraphProps, 'sectionTitle' | 'sectionDescription'>,
  paragraph: HorizontalTableParagraph
): UjatRecruitParagraphProps {
  return {
    ...base,
    sectionTitle: paragraph.paragraphTitle,
    sectionDescription: getVisibleParagraphDescription(paragraph.paragraphDescription),
  }
}

function renderInstitutionParagraph(
  paragraph: HorizontalTableParagraph,
  options: UjatRecruitParagraphProps
): ReactNode {
  return renderUjatRecruitFormInstitutionParagraphBody(paragraph, true, options)
}

function renderVolunteerParagraph(
  paragraph: HorizontalTableParagraph,
  options: UjatRecruitParagraphProps
): ReactNode {
  return renderUjatRecruitFormVolunteerParagraphBody(paragraph, true, options)
}

export function UjatProgramRecruitmentPanels({
  program,
  sponsorName,
  activeRecruitTab,
  isEditMode,
  institutionsForm,
  volunteersForm,
  registerVolunteersAdditionalHtml,
}: {
  program: Program
  sponsorName?: string
  activeRecruitTab: UjatRecruitTabKey
  isEditMode: boolean
  institutionsForm?: UseFormReturn<ProgramDetailEditFormValues>
  volunteersForm?: UseFormReturn<ProgramDetailEditFormValues>
  registerVolunteersAdditionalHtml?: (getter: () => string) => void
}) {
  const volunteerHalf = volunteerHalfFromRecruitTab(activeRecruitTab)

  if (activeRecruitTab === 'recruit_participant') {
    const draft = getUjatRecruitInstitutionDraft()
    const baseOptions = {
      mode: resolveUjatRecruitParagraphMode({
        mode: isEditMode ? 'edit' : 'view',
        program,
        form: institutionsForm,
      }),
      program,
      sponsorName,
      form: institutionsForm,
    }
    return (
      <div className="ujat-program-recruitment-panels">
        {draft.paragraphs.map(p => {
          if (p.kind !== 'single_item' || p.variant !== 'horizontal_table') return null
          const body = renderInstitutionParagraph(p, paragraphRenderOptions(baseOptions, p))
          if (!body) return null
          return (
            <section key={p.id} className="ujat-program-recruitment-panels__paragraph">
              {body}
            </section>
          )
        })}
      </div>
    )
  }

  const draft = getUjatRecruitVolunteerDraft()
  const baseOptions = {
    mode: resolveUjatRecruitParagraphMode({
      mode: isEditMode ? 'edit' : 'view',
      program,
      form: volunteersForm,
    }),
    program,
    sponsorName,
    form: volunteersForm,
    volunteerHalf: volunteerHalf ?? 'h1',
    onRegisterGetAdditionalContentHtml: registerVolunteersAdditionalHtml,
  }

  return (
    <div className="ujat-program-recruitment-panels">
      {draft.paragraphs.map(p => {
        if (p.kind !== 'single_item' || p.variant !== 'horizontal_table') return null
        const body = renderVolunteerParagraph(p, paragraphRenderOptions(baseOptions, p))
        if (!body) return null
        return (
          <section key={p.id} className="ujat-program-recruitment-panels__paragraph">
            {body}
          </section>
        )
      })}
    </div>
  )
}
