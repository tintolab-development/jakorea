/**
 * 인재채용 지원 알림 메일 본문 프리셋.
 *
 * 표 스타일은 재능기부 메일과 동일(layout-html + body-tables.css).
 * Figma 652:13579(전체), 652:13595(기본 정보), 652:13646(학력 정보).
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

export const CAREERS_MAIL_LAYOUT_VERSION = 'careers-v1'

/** 현재 인재채용 지원 알림 메일 템플릿의 CMS template id. */
export const CAREERS_MAIL_TEMPLATE_ID = '236'

export const CAREERS_MAIL_DATA_VARIABLE_LABELS = [
  '회원명',
  '신청일시',
  '처리 상태',
  '개인정보 수집·이용 동의',
  '지원자명',
  '관심 직무',
  '연락처',
  '이메일',
  '자택 주소',
  '최종학력',
  '학력정보',
  '경력',
  '경력/경험/자격정보',
] as const

export const CAREERS_MAIL_DETAIL_LINK_VARIABLE_LABEL = '알림 링크 경로'

function introduction(): string {
  return mailGreetingParagraphs([
    `안녕하세요? ${mailVariable('회원명')}님,<br />JA Korea 입니다.`,
    '신규 접수된 인재채용 건이 있습니다.<br />지원 내용을 확인해 주세요.',
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

function applicantInfoTable(): string {
  return mailTableShell(`
    <tr>
      ${mailLabelCell('지원자명')}
      ${mailValueCell('지원자명')}
      ${mailLabelCell('관심 직무')}
      ${mailValueCell('관심 직무')}
    </tr>
    <tr>
      ${mailLabelCell('연락처')}
      ${mailValueCell('연락처')}
      ${mailLabelCell('이메일')}
      ${mailValueCell('이메일')}
    </tr>
    <tr>
      ${mailLabelCell('자택 주소')}
      ${mailValueCell('자택 주소', 3)}
    </tr>
  `)
}

function educationInfoTable(): string {
  return mailTableShell(`
    <tr>
      ${mailLabelCell('최종학력')}
      ${mailValueCell('최종학력')}
    </tr>
    <tr>
      ${mailLabelCell('학력정보')}
      ${mailLongTextValueCell('학력정보')}
    </tr>
  `)
}

function careerInfoTable(): string {
  return mailTableShell(`
    <tr>
      ${mailLabelCell('경력')}
      ${mailValueCell('경력')}
    </tr>
    <tr>
      ${mailLabelCell('경력/경험/자격정보')}
      ${mailLongTextValueCell('경력/경험/자격정보')}
    </tr>
  `)
}

export function buildCareersMailLayoutHtml(): string {
  return wrapMailLayoutHtml(
    CAREERS_MAIL_LAYOUT_VERSION,
    `
  ${introduction()}
  ${mailSectionHeading('기본 정보')}
  ${statusInfoTable()}
  ${applicantInfoTable()}
  ${mailSectionHeading('학력 정보')}
  ${educationInfoTable()}
  ${mailSectionHeading('경력 정보')}
  ${careerInfoTable()}
  ${mailDetailButton('인재채용 지원 상세보기', CAREERS_MAIL_DETAIL_LINK_VARIABLE_LABEL)}
`
  )
}

export function resolveCareersMailTemplateBodyHtml(
  templateId: string | number | null | undefined,
  bodyHtml: string
): string {
  return resolvePresetBodyHtml(
    templateId,
    CAREERS_MAIL_TEMPLATE_ID,
    CAREERS_MAIL_LAYOUT_VERSION,
    bodyHtml,
    buildCareersMailLayoutHtml
  )
}

export function ensureCareersMailTemplateLayoutMarker(
  templateId: string | number | null | undefined,
  bodyHtml: string
): string {
  return ensurePresetLayoutMarker(
    templateId,
    CAREERS_MAIL_TEMPLATE_ID,
    CAREERS_MAIL_LAYOUT_VERSION,
    bodyHtml
  )
}
