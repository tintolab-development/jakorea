/**
 * 기업 후원 상담 신청 알림 메일 본문 프리셋.
 *
 * 표 스타일은 재능기부·인재채용 메일과 동일(layout-html + body-tables.css).
 * Figma 652:13401(신청 정보), 652:13446(상담 정보).
 */

import {
  ensurePresetLayoutMarker,
  mailDetailButton,
  mailFirstRowSpanRestLock,
  mailGreetingParagraphs,
  mailLabelCell,
  mailLongTextValueCell,
  mailSectionHeading,
  mailTableShell,
  mailValueCell,
  mailVariable,
  resolvePresetBodyHtml,
  wrapMailLayoutHtml,
} from './layout-html'

export const CONSULTATION_MAIL_LAYOUT_VERSION = 'consultation-v1'

/** 현재 기업 후원 상담 신청 알림 메일 템플릿의 CMS template id. */
export const CONSULTATION_MAIL_TEMPLATE_ID = '233'

export const CONSULTATION_MAIL_DATA_VARIABLE_LABELS = [
  '회원명',
  '신청일시',
  '처리 상태',
  '개인정보 수집·이용 동의',
  '기업명',
  '담당자명',
  '부서/직함명',
  '담당자 연락처',
  '상담 내용',
  '링크 삽입',
  '첨부파일',
] as const

export const CONSULTATION_MAIL_DETAIL_LINK_VARIABLE_LABEL = '알림 링크 경로'

function introduction(): string {
  return mailGreetingParagraphs([
    `안녕하세요? ${mailVariable('회원명')}님,<br />JA Korea 입니다.`,
    '신규 접수된 기업 후원 상담 신청 건이 있습니다.<br />상담 내용을 확인하고 담당자를 배정해 후속 연락을 진행해 주세요.',
    '감사합니다.<br />JA Korea 드림.',
  ])
}

function statusInfoTable(): string {
  return mailTableShell(`
    <tr>
      ${mailLabelCell('신청일시')}
      ${mailValueCell('신청일시')}
      ${mailFirstRowSpanRestLock()}
    </tr>
    <tr>
      ${mailLabelCell('처리 상태')}
      ${mailValueCell('처리 상태')}
      ${mailLabelCell('개인정보 수집·이용 동의')}
      ${mailValueCell('개인정보 수집·이용 동의')}
    </tr>
  `)
}

function companyInfoTable(): string {
  return mailTableShell(`
    <tr>
      ${mailLabelCell('기업명')}
      ${mailValueCell('기업명')}
      ${mailLabelCell('담당자명')}
      ${mailValueCell('담당자명')}
    </tr>
    <tr>
      ${mailLabelCell('부서/직함명')}
      ${mailValueCell('부서/직함명')}
      ${mailLabelCell('담당자 연락처')}
      ${mailValueCell('담당자 연락처')}
    </tr>
  `)
}

function consultInfoTable(): string {
  return mailTableShell(`
    <tr>
      ${mailLabelCell('상담 내용')}
      ${mailLongTextValueCell('상담 내용')}
    </tr>
    <tr>
      ${mailLabelCell('링크 삽입')}
      ${mailValueCell('링크 삽입')}
    </tr>
    <tr>
      ${mailLabelCell('첨부파일')}
      ${mailValueCell('첨부파일')}
    </tr>
  `)
}

export function buildConsultationMailLayoutHtml(): string {
  return wrapMailLayoutHtml(
    CONSULTATION_MAIL_LAYOUT_VERSION,
    `
  ${introduction()}
  ${mailSectionHeading('신청 정보')}
  ${statusInfoTable()}
  ${companyInfoTable()}
  ${mailSectionHeading('상담 정보')}
  ${consultInfoTable()}
  ${mailDetailButton('후원 상담 신청 상세보기', CONSULTATION_MAIL_DETAIL_LINK_VARIABLE_LABEL)}
`
  )
}

export function resolveConsultationMailTemplateBodyHtml(
  templateId: string | number | null | undefined,
  bodyHtml: string
): string {
  return resolvePresetBodyHtml(
    templateId,
    CONSULTATION_MAIL_TEMPLATE_ID,
    CONSULTATION_MAIL_LAYOUT_VERSION,
    bodyHtml,
    buildConsultationMailLayoutHtml
  )
}

export function ensureConsultationMailTemplateLayoutMarker(
  templateId: string | number | null | undefined,
  bodyHtml: string
): string {
  return ensurePresetLayoutMarker(
    templateId,
    CONSULTATION_MAIL_TEMPLATE_ID,
    CONSULTATION_MAIL_LAYOUT_VERSION,
    bodyHtml
  )
}
