import {
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS,
  createAgreementPortraitDraft,
  normalizeWritingFormDraft,
  type VerticalTableRow,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import type { SchoolDetailStudentRow } from '../model/school-detail-types'
import { PORTRAIT_CONSENT_DOCUMENT_TITLE } from './student-portrait-consent'

export interface PortraitConsentDownloadContext {
  student: Pick<SchoolDetailStudentRow, 'id' | 'name' | 'gradeClass'>
  schoolName: string
  educationGrade: string
}

function fillPersonalConsentTable(
  paragraph: WritingFormParagraph,
  ctx: PortraitConsentDownloadContext
): WritingFormParagraph {
  if (paragraph.id !== AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable) {
    return paragraph
  }
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'vertical_table') {
    return paragraph
  }

  const affiliation = [ctx.schoolName, ctx.educationGrade, ctx.student.gradeClass]
    .map(part => part?.trim())
    .filter(Boolean)
    .join(' ')

  const rows: VerticalTableRow[] = [
    {
      stageCount: 2,
      headers: ['성명', '소속'],
      cells: [ctx.student.name, affiliation || '소속 없음'],
    },
    ...paragraph.rows.slice(1),
  ]

  return { ...paragraph, rows }
}

/** 교사 제출분 mock — `agreement-portrait` 양식에 학생·기관 정보 반영 */
export function buildPortraitConsentFilledDraft(
  ctx: PortraitConsentDownloadContext
): WritingFormDraft {
  const base = normalizeWritingFormDraft(createAgreementPortraitDraft())
  return {
    ...base,
    paragraphs: base.paragraphs.map(paragraph => fillPersonalConsentTable(paragraph, ctx)),
  }
}

export function buildPortraitConsentDownloadFileName(ctx: PortraitConsentDownloadContext): string {
  const safeName = ctx.student.name.replace(/[/\\?%*:|"<>]/g, '_').trim() || '학생'
  const safeSchool = ctx.schoolName.replace(/[/\\?%*:|"<>]/g, '_').trim() || '기관'
  return `${PORTRAIT_CONSENT_DOCUMENT_TITLE}_${safeSchool}_${safeName}`
}

export function buildPortraitConsentDownloadContext(
  student: SchoolDetailStudentRow,
  schoolName: string,
  educationGrade: string
): PortraitConsentDownloadContext {
  return {
    student: {
      id: student.id,
      name: student.name,
      gradeClass: student.gradeClass,
    },
    schoolName,
    educationGrade,
  }
}

export { PORTRAIT_CONSENT_DOCUMENT_TITLE }
