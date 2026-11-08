/**
 * 기업후원 상담 — 개인정보 수집·이용 동의 (Figma 13260:85068 · 팝업 13025:85798)
 * 기업 후원 상담 신청 전용 문구 (인재풀 등록 문구와 다름)
 */
export const CORPORATE_DONATION_INQUIRY_PRIVACY_CONSENT_INTRO =
  '본인은 「개인정보 보호법」 제15조에 따라 아래 개인정보의 수집·이용 목적, 수집 항목, 보유 기간에 대해 안내받고 동의합니다.'

export const CORPORATE_DONATION_INQUIRY_PRIVACY_CONSENT_SECTIONS = [
  {
    heading: '개인정보 수집항목',
    paragraphs: [
      '필수 : 기업명, 담당자 이름, 부서명·직함, 휴대폰 번호, 상담 내용',
      '선택 : 링크, 첨부파일',
    ],
  },
  {
    heading: '개인 정보의 수집, 이용 목적',
    paragraphs: ['기업 후원 상담 신청 확인 및 회신'],
  },
  {
    heading: '개인정보의 보유 및 이용기간',
    paragraphs: [
      '동의일로부터 6개월(개인이 파기 요구 시 즉시 파기)',
      '동의를 거부할 권리가 있으며, 동의하지 않으면 기업 후원 상담 신청이 제한됩니다.',
    ],
  },
  {
    heading: '개인정보 관리 책임',
    paragraphs: ['이선아 사무국장 salee@jakorea.org 02-783-2367'],
  },
] as const

export const CORPORATE_DONATION_INQUIRY_PRIVACY_CONSENT_FIELD_LABEL =
  '개인정보 수집 및 이용 동의'

export const CORPORATE_DONATION_INQUIRY_PRIVACY_AGREEMENT_LABEL = '개인정보 수집·이용 동의'
