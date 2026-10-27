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

export const TALENT_DONATION_MAIL_LAYOUT_VERSION = 'talent-donation-v10'

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
] as const

export const TALENT_DONATION_MAIL_DETAIL_LINK_VARIABLE_LABEL = '알림 링크 경로'

const LABEL_COL_WIDTH_PX = 140

const variable = (label: string) => `<span data-mail-variable="${label}">#{${label}}</span>`

const cellStyle =
  'border:0;vertical-align:middle;color:#3d3d3d;font-family:Pretendard,Arial,sans-serif;font-size:12px;line-height:1.5;'
const labelCellStyle = `${cellStyle}width:${LABEL_COL_WIDTH_PX}px;min-width:${LABEL_COL_WIDTH_PX}px;max-width:${LABEL_COL_WIDTH_PX}px;padding:9px 10px;background:linear-gradient(0deg,rgba(231,235,239,0.6) 0%,rgba(231,235,239,0.6) 100%),#fff;text-align:center;font-weight:700;white-space:nowrap;`
const valueCellStyle = `${cellStyle}padding:9px 12px;background:#ffffff;text-align:left;font-weight:500;word-break:break-word;`
const longTextValueCellStyle = `${cellStyle}vertical-align:top;padding:9px 12px;background:#ffffff;text-align:left;font-weight:500;word-break:break-word;`
const labelCellAttributes = `colwidth="${LABEL_COL_WIDTH_PX}"`

function sectionHeading(label: string): string {
  return `<h3 style="margin:0 0 6px 0;color:#3d3d3d;font-family:Pretendard,Arial,sans-serif;font-size:14px;line-height:1.4;font-weight:700;">${label}</h3>`
}

function introduction(): string {
  const paragraphStyle =
    'margin:0 0 24px 0;color:#3d3d3d;font-family:Pretendard,Arial,sans-serif;font-size:14px;line-height:1.5;'

  return `
    <p style="${paragraphStyle}">안녕하세요? ${variable('회원명')}님,<br />JA Korea 입니다.</p>
    <p style="${paragraphStyle}">신규 접수된 재능기부 신청 건이 있습니다.<br />신청 내용을 확인해 주세요.</p>
    <p style="margin:0 0 24px 0;color:#3d3d3d;font-family:Pretendard,Arial,sans-serif;font-size:14px;line-height:1.5;">감사합니다.<br />JA Korea 드림.</p>
  `
}

function tableShell(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;border-collapse:separate;border-spacing:0;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;background:#ffffff;">${rows}</table>`
}

function labelCell(label: string): string {
  return `<th ${labelCellAttributes} style="${labelCellStyle}">${label}</th>`
}

function valueCell(label: string, colspan?: number): string {
  const span = colspan && colspan > 1 ? ` colspan="${colspan}"` : ''
  return `<td${span} style="${valueCellStyle}">${variable(label)}</td>`
}

/** 첫 행 열 폭을 140/flex/140/flex 로 잠그고, 값은 한 칸처럼 보이게 나머지 칸을 비운다. */
function firstRowSpanRestLock(): string {
  return `<td ${labelCellAttributes} style="${valueCellStyle}width:${LABEL_COL_WIDTH_PX}px;min-width:${LABEL_COL_WIDTH_PX}px;max-width:${LABEL_COL_WIDTH_PX}px;">&nbsp;</td><td style="${valueCellStyle}">&nbsp;</td>`
}

/** 시안 첫 카드: 신청일시 + 처리 상태. 한 테이블이라 보더가 겹치지 않는다. */
function statusInfoTable(): string {
  return tableShell(`
    <tr>
      ${labelCell('신청일시')}
      ${valueCell('신청일시')}
      ${firstRowSpanRestLock()}
    </tr>
    <tr>
      ${labelCell('처리 상태')}
      ${valueCell('처리 상태')}
      ${labelCell('개인정보 수집·이용 동의')}
      ${valueCell('개인정보 수집·이용 동의')}
    </tr>
  `)
}

/** 시안: 처리 상태 표 아래 12px 간격으로 분리된 신청자 정보 표 */
function applicantInfoTable(): string {
  return tableShell(`
    <tr>
      ${labelCell('신청자명')}
      ${valueCell('신청자명')}
      ${labelCell('성별 및 생년월일')}
      ${valueCell('성별 및 생년월일')}
    </tr>
    <tr>
      ${labelCell('연락처')}
      ${valueCell('연락처')}
      ${labelCell('이메일')}
      ${valueCell('이메일')}
    </tr>
    <tr>
      ${labelCell('소속')}
      ${valueCell('소속')}
      ${labelCell('자택 주소')}
      ${valueCell('자택 주소')}
    </tr>
    <tr>
      ${labelCell('재능기부 가능 기간')}
      ${valueCell('재능기부 가능 기간', 3)}
    </tr>
  `)
}

function additionalInfoValueCell(label: string): string {
  return `<td style="${longTextValueCellStyle}">${variable(label)}</td>`
}

function additionalInfoTable(): string {
  return tableShell(`
    <tr>
      ${labelCell('간단한 약력 소개')}
      ${additionalInfoValueCell('간단한 약력 소개')}
    </tr>
    <tr>
      ${labelCell('기부 가능한 재능 소개')}
      ${additionalInfoValueCell('기부 가능한 재능 소개')}
    </tr>
    <tr>
      ${labelCell('참여 동기')}
      ${additionalInfoValueCell('참여 동기')}
    </tr>
  `)
}

function detailButton(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:separate;border-spacing:0;"><tr><td align="center" height="52" bgcolor="#01a1af" style="height:52px;border-radius:8px;background:#01a1af;text-align:center;"><a href="#{${TALENT_DONATION_MAIL_DETAIL_LINK_VARIABLE_LABEL}}" target="_blank" rel="noopener noreferrer" style="display:block;height:52px;box-sizing:border-box;padding:8px 20px;color:#ffffff;font-family:Pretendard,Arial,sans-serif;font-size:16px;line-height:36px;font-weight:600;text-decoration:none;">재능기부 신청 상세보기</a></td></tr></table>`
}

/** CMS 편집기에 기본 적용하고 저장하는 메일 본문 원문 HTML. */
export function buildTalentDonationMailLayoutHtml(): string {
  return `<!-- ja-mail-layout:${TALENT_DONATION_MAIL_LAYOUT_VERSION} -->
<div style="width:100%;max-width:100%;margin:0 auto;padding:0;background:#ffffff;">
  ${introduction()}
  ${sectionHeading('기본 정보')}
  ${statusInfoTable()}
  ${applicantInfoTable()}
  ${sectionHeading('추가 정보')}
  ${additionalInfoTable()}
  ${detailButton()}
</div>`
}

/**
 * 재능기부 신청 알림 템플릿을 열 때만 메인 시안을 기본 본문으로 사용한다.
 * 다른 메일 템플릿의 원격 본문은 변경하지 않는다.
 */
export function resolveMailTemplateBodyHtml(
  templateId: string | number | null | undefined,
  bodyHtml: string
): string {
  if (String(templateId) !== TALENT_DONATION_MAIL_TEMPLATE_ID) return bodyHtml
  if (bodyHtml.includes(`ja-mail-layout:${TALENT_DONATION_MAIL_LAYOUT_VERSION}`)) return bodyHtml
  return buildTalentDonationMailLayoutHtml()
}

/**
 * TipTap이 본문을 다시 직렬화하면 HTML 주석이 사라질 수 있으므로,
 * 사용자가 본문을 수정해 저장할 때 현재 레이아웃 버전을 다시 남긴다.
 * 이 표식은 메일 본문에 보이지 않으며, 다음 조회에서 사용자 수정 본문을
 * 기본 시안으로 오인해 덮어쓰지 않게 하는 저장용 메타데이터다.
 */
export function ensureMailTemplateLayoutMarker(
  templateId: string | number | null | undefined,
  bodyHtml: string
): string {
  if (String(templateId) !== TALENT_DONATION_MAIL_TEMPLATE_ID || !bodyHtml.trim()) {
    return bodyHtml
  }
  const marker = 'ja-mail-layout:' + TALENT_DONATION_MAIL_LAYOUT_VERSION
  if (bodyHtml.includes(marker)) return bodyHtml
  return '<!-- ' + marker + ' -->\n' + bodyHtml
}
