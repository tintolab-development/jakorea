/**
 * 재능기부 신청 — 개인정보 수집·이용 동의 안내문 (Figma 시안).
 */
export const TALENT_APPLY_PRIVACY_CONSENT_INTRO =
  '본인은 개인정보보호법 제15조 및 제 24조에 따라 귀하의 개인정보 수집, 이용목적, 수집하려는 개인정보의 항목, 개인정보 보유 기간에 대해 동의합니다.'

export const TALENT_APPLY_PRIVACY_CONSENT_SECTIONS = [
  {
    heading: '개인정보 수집항목',
    paragraphs: [
      '필수 : 이름, 생년월일 및 성별, 휴대폰 번호, 이메일 주소, 소속 및 학년, 자택 주소, JA 프로그램 참여 이력, 신청자 제출 파일',
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
    paragraphs: ['동의일로부터 6개월(개인이 파기 요구시 즉시 파기)'],
  },
  {
    heading: '개인정보 관리 책임',
    paragraphs: ['이선아 사무국장 salee@jakorea.org 02-783-2367'],
  },
] as const

export const TALENT_APPLY_PRIVACY_CONSENT_LABEL = '개인정보 수집 및 이용 동의'
