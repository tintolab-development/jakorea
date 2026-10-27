/**
 * 재능기부 신청 알림 메일 본문 프리셋.
 *
 * 메일 클라이언트는 외부 CSS와 flex/grid를 안정적으로 지원하지 않으므로
 * 실제 발송 본문은 table + inline style만 사용한다. CMS 수정/미리보기는
 * TipTap이 colgroup을 버리므로 th colwidth=140 과 body-tables.css가 SSOT다.
 * 변수 값은 알림 이벤트가 제공하는 원격 계약에서 치환되어야 하며,
 * 이 모듈에서 예시값을 생성하지 않는다.
 *
 * Figma 652:13465 — 라벨 열 140px, 행 36px, 표 radius 8px, 표 간격 12px.
 * TipTap table-layout:fixed 는 첫 행으로 열 폭을 잡으므로, 신청일시 행도
 * 4칸(140 / flex / 140 / flex)이어야 아래 신청자 표와 열이 맞는다.
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

export const TALENT_DONATION_MAIL_LAYOUT_VERSION = 'talent-donation-v11'

/** 현재 재능기부 신청 알림 메일 템플릿의 CMS template id. */
export const TALENT_DONATION_MAIL_TEMPLATE_ID = '237'

/** 백엔드 신청 이벤트가 실제 입력값으로 치환해야 하는 본문 데이터 토큰. */
export const TALENT_DONATION_MAIL_DATA_VARIABLE_LABELS = [
  '회원명',
  '신청일시',
  '처리 상태',
  '개인정보 수집·이용 동의',
  '신청자명',
  '성별 및 생년월일',
  '연락처',
  '이메일',
  '소속',
  '자택 주소',
  '재능기부 가능 기간',
  '간단한 약력 소개',
  '기부 가능한 재능 소개',
  '참여 동기',
  'JA 프로그램 참여 이력',
  '자유 제출 파일',
] as const

export const TALENT_DONATION_MAIL_DETAIL_LINK_VARIABLE_LABEL = '알림 링크 경로'

function introduction(): string {
  return mailGreetingParagraphs([
    `안녕하세요? ${mailVariable('회원명')}님,<br />JA Korea 입니다.`,
    '신규 접수된 재능기부 신청 건이 있습니다.<br />신청 내용을 확인해 주세요.',
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
      ${mailLabelCell('신청자명')}
      ${mailValueCell('신청자명')}
      ${mailLabelCell('성별 및 생년월일')}
      ${mailValueCell('성별 및 생년월일')}
    </tr>
    <tr>
      ${mailLabelCell('연락처')}
      ${mailValueCell('연락처')}
      ${mailLabelCell('이메일')}
      ${mailValueCell('이메일')}
    </tr>
    <tr>
      ${mailLabelCell('소속')}
      ${mailValueCell('소속')}
      ${mailLabelCell('자택 주소')}
      ${mailValueCell('자택 주소')}
    </tr>
    <tr>
      ${mailLabelCell('재능기부 가능 기간')}
      ${mailValueCell('재능기부 가능 기간', 3)}
    </tr>
  `)
}

function additionalInfoTable(): string {
  return mailTableShell(`
    <tr>
      ${mailLabelCell('간단한 약력 소개')}
      ${mailLongTextValueCell('간단한 약력 소개')}
    </tr>
    <tr>
      ${mailLabelCell('기부 가능한 재능 소개')}
      ${mailLongTextValueCell('기부 가능한 재능 소개')}
    </tr>
    <tr>
      ${mailLabelCell('참여 동기')}
      ${mailLongTextValueCell('참여 동기')}
    </tr>
    <tr>
      ${mailLabelCell('JA 프로그램 참여 이력')}
      ${mailValueCell('JA 프로그램 참여 이력')}
    </tr>
    <tr>
      ${mailLabelCell('자유 제출 파일')}
      ${mailValueCell('자유 제출 파일')}
    </tr>
  `)
}

export function buildTalentDonationMailLayoutHtml(): string {
  return wrapMailLayoutHtml(
    TALENT_DONATION_MAIL_LAYOUT_VERSION,
    `
  ${introduction()}
  ${mailSectionHeading('기본 정보')}
  ${statusInfoTable()}
  ${applicantInfoTable()}
  ${mailSectionHeading('추가 정보')}
  ${additionalInfoTable()}
  ${mailDetailButton('재능기부 신청 상세보기', TALENT_DONATION_MAIL_DETAIL_LINK_VARIABLE_LABEL)}
`
  )
}

export function resolveTalentDonationMailTemplateBodyHtml(
  templateId: string | number | null | undefined,
  bodyHtml: string
): string {
  return resolvePresetBodyHtml(
    templateId,
    TALENT_DONATION_MAIL_TEMPLATE_ID,
    TALENT_DONATION_MAIL_LAYOUT_VERSION,
    bodyHtml,
    buildTalentDonationMailLayoutHtml
  )
}

export function ensureTalentDonationMailTemplateLayoutMarker(
  templateId: string | number | null | undefined,
  bodyHtml: string
): string {
  return ensurePresetLayoutMarker(
    templateId,
    TALENT_DONATION_MAIL_TEMPLATE_ID,
    TALENT_DONATION_MAIL_LAYOUT_VERSION,
    bodyHtml
  )
}

export const resolveMailTemplateBodyHtml = resolveTalentDonationMailTemplateBodyHtml
export const ensureMailTemplateLayoutMarker = ensureTalentDonationMailTemplateLayoutMarker
