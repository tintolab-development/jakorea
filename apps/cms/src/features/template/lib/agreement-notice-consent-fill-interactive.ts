import { AGREEMENT_NOTICE_PARAGRAPH_IDS } from '@/features/template/model/writing-form-draft.schema'

/**
 * 행정정보 공동이용 사전 동의 — 회원 fill에서 양식 잠금과 별도로 입력 가능한 응답 단락.
 * (이용기관 명칭·이용사무·대상자 본인 필드 입력. 식별번호 텍스트는 표 하단 별도 플래그)
 * 대상자 본인은 단락 단위 입력만 허용 — 항목별 선택·활성(수정모드 UX)은 `ShortEssay`에서 차단.
 */
export const AGREEMENT_NOTICE_CONSENT_FILL_INTERACTIVE_PARAGRAPH_IDS = new Set<string>([
  AGREEMENT_NOTICE_PARAGRAPH_IDS.institution,
  AGREEMENT_NOTICE_PARAGRAPH_IDS.purpose,
  AGREEMENT_NOTICE_PARAGRAPH_IDS.subject,
])
