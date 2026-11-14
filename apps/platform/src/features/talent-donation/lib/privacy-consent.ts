/**
 * 재능기부 신청 — 개인정보 수집·이용 동의 안내문.
 * 수집 항목은 동의서 최신본(11/10, 양식 19) 기준 「소속(학교명)」(학년 없음) — QA-0522.
 */
export const TALENT_APPLY_PRIVACY_CONSENT_INTRO =
  '본인은 「개인정보 보호법」 제15조에 따라 아래 개인정보의 수집·이용 목적, 수집 항목, 보유 기간에 대해 안내받고 동의합니다.'

export const TALENT_APPLY_PRIVACY_CONSENT_SECTIONS = [
  {
    heading: '개인정보 수집항목',
    paragraphs: [
      '필수 : 이름, 생년월일 및 성별, 휴대폰 번호, 이메일 주소, 소속(학교명), 자택 주소, 재능기부 가능 기간, 약력·재능 소개·참여 동기, JA 프로그램 참여 이력',
      '선택 : 신청자 제출 파일',
    ],
  },
  {
    heading: '개인 정보의 수집, 이용 목적',
    paragraphs: [
      '재능기부에 따른 자격요건의 확인 및 지원자와의 원활한 의사소통 경로 확보',
    ],
  },
  {
    heading: '개인정보의 보유 및 이용기간',
    paragraphs: [
      '동의일로부터 6개월(개인이 파기 요구 시 즉시 파기)',
      '동의를 거부할 권리가 있으며, 동의하지 않으면 재능기부 신청이 제한됩니다.',
    ],
  },
  {
    heading: '개인정보 관리 책임',
    paragraphs: ['이선아 사무국장 salee@jakorea.org 02-783-2367'],
  },
] as const

export const TALENT_APPLY_PRIVACY_CONSENT_LABEL = '개인정보 수집 및 이용 동의'
