import type { ReactNode } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/model/program-detail-edit-schema'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { UJAT_RECRUIT_FORM_VOLUNTEER_IDS } from '@/features/template/model/ujat-recruit-form-volunteer-draft'
import { renderUjatRecruitFormInstitutionParagraphBody } from '@/features/template/ui/form-set/recruit-form/UJAT-institution/paragraph-body'
import { renderUjatRecruitFormVolunteerParagraphBody } from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/paragraph-body'
import { getUjatRecruitInstitutionDraft, getUjatRecruitVolunteerDraft } from './ujat-recruit-template-draft'
import {
  type UjatRecruitParagraphProps,
  resolveUjatRecruitParagraphMode,
} from './ujat-recruit-paragraph-props'
import type { UjatRecruitTabKey } from './ujat-program-detail-recruitment-tabs'
import { volunteerHalfFromRecruitTab, volunteerRecruitInfoSectionTitle } from './ujat-program-detail-recruitment-tabs'
import '@/features/program/program-detail/ui/project-info/project-info-form-shared.css'
import './ujat-program-recruitment.css'

function institutionParagraphRenderOptions(
  base: Omit<UjatRecruitParagraphProps, 'sectionTitle'>,
  paragraph: HorizontalTableParagraph
): UjatRecruitParagraphProps {
  return {
    ...base,
    sectionTitle: paragraph.paragraphTitle,
  }
}

function volunteerParagraphRenderOptions(
  base: Omit<UjatRecruitParagraphProps, 'sectionTitle'>,
  paragraph: HorizontalTableParagraph,
  activeRecruitTab: UjatRecruitTabKey
): UjatRecruitParagraphProps {
  const recruitInfoTitle = volunteerRecruitInfoSectionTitle(activeRecruitTab)
  return {
    ...base,
    sectionTitle:
      paragraph.id === UJAT_RECRUIT_FORM_VOLUNTEER_IDS.recruitInfo && recruitInfoTitle
        ? recruitInfoTitle
        : paragraph.paragraphTitle,
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
  registerInstitutionsAdditionalHtml,
  registerVolunteersAdditionalHtml,
}: {
  program: Program
  sponsorName?: string
  activeRecruitTab: UjatRecruitTabKey
  isEditMode: boolean
  institutionsForm?: UseFormReturn<ProgramDetailEditFormValues>
  volunteersForm?: UseFormReturn<ProgramDetailEditFormValues>
  registerInstitutionsAdditionalHtml?: (getter: () => string) => void
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
      onRegisterGetAdditionalContentHtml: registerInstitutionsAdditionalHtml,
    }
    return (
      <div className="ujat-program-recruitment-panels">
        {draft.paragraphs.map(p => {
          if (p.kind !== 'single_item' || p.variant !== 'horizontal_table') return null
          const body = renderInstitutionParagraph(p, institutionParagraphRenderOptions(baseOptions, p))
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
        const body = renderVolunteerParagraph(
          p,
          volunteerParagraphRenderOptions(baseOptions, p, activeRecruitTab)
        )
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
