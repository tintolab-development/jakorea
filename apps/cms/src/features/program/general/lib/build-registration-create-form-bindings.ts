import type { Program } from '@/types/domain'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { prepareRegistrationCreateFormBindings } from '@/features/program/general/lib/prepare-registration-create-form-bindings'

/**
 * CREATE 후 프로그램 전용 COPY로 적용할 양식 1건 (순수 데이터, 서버 호출 없음).
 * `draft`가 null이면 적용 시점에 바인딩된 버전 본문(baseline)을 그대로 쓰고 overlay만 반영한다.
 */
export type RegistrationFormApplyItem = {
  templateCode: string
  formType: string
  draft: WritingFormDraft | null
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
  settingsJson?: Record<string, unknown>
}

/**
 * 등록 완료 시 준비한 "CREATE 후 적용할 양식 목록".
 * 서버 임시저장·draft-owned COPY를 쓰지 않는다.
 */
export type RegistrationCreateFormBindingsPayload = {
  forms: RegistrationFormApplyItem[]
}

/** flush 없이 overlay·로컬 양식 초안만 모은다 — 등록 완료는 `prepareRegistrationCreateFormBindings` 사용. */
export async function buildRegistrationCreateFormBindings(
  program: Program
): Promise<RegistrationCreateFormBindingsPayload | null> {
  return prepareRegistrationCreateFormBindings({ program })
}
