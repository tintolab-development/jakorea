import { AGREEMENT_NOTICE_PARAGRAPH_IDS } from '@/features/template/model/writing-form-draft.schema'

/**
 * 행정정보 공동이용 사전 동의 — 회원 fill에서 양식 잠금과 별도로 입력 가능한 응답 단락.
 * (대상자 본인. 이용기관·이용사무는 시드 고정 비활성 인풋. 식별번호 텍스트는 표 하단 별도 플래그)
 */
export const AGREEMENT_NOTICE_CONSENT_FILL_INTERACTIVE_PARAGRAPH_IDS = new Set<string>([
  AGREEMENT_NOTICE_PARAGRAPH_IDS.subject,
])
