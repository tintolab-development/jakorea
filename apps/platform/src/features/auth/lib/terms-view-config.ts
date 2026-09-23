import type { TermsViewType } from '../model/terms-view.types'

export const TERMS_VIEW_TITLES: Record<TermsViewType, string> = {
  serviceTerms: '서비스 이용약관',
  privacyCollection: '개인정보 수집·이용 동의 약관',
  mfaSetup: '2단계 인증(MFA) 설정 동의 약관',
  marketing: '마케팅 정보 수신 동의 약관',
  portrait: '초상권 수집·이용 동의 약관',
  teacherInfo: '교사회원 가입 및 학교/기관 정보 수집·이용 동의 약관',
  guardianLegal: '만 14세 미만 아동 회원가입 법정대리인 동의 약관',
  privacyNotice: '개인정보처리방침',
}
