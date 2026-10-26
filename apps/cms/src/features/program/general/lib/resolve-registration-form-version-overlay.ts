/**
 * P5-b R2: 등록 Form Version PUT에 실을 overlay를 정한다.
 *
 * - 일반: CREATE 빌더(`buildGeneralProgramCreateFromWizardRhf`)가 만든 `program.registrationOverlay`
 *   (RHF에서 정규화된 persist overlay)를 **같은 객체로** 쓴다. 스토어 원본 overlay를 보내면
 *   회차 단원명·운영기간 종료일·담당자 센티넬 등이 CREATE와 달라진다(R2).
 *   빌더 결과가 없을 때만(구 경로) 스토어 overlay로 fallback 한다.
 * - 1사1교: RHF 직렬화 결과(호출부에서 계산해 전달).
 * - TT: 등록 Form Version overlay 없음(undefined) — TT 동작 불변.
 */
/** 'general' | 'economy' | 'trainedTeachers' 외 값(UJAT 등)은 기존처럼 스토어 사본 */
export type RegistrationFormVersionOverlayVariant = string

export function resolveRegistrationFormVersionOverlay(args: {
  variant: RegistrationFormVersionOverlayVariant
  createProgramOverlay?: Record<string, unknown> | null
  companySchoolOverlay?: Record<string, unknown> | null
  readStoreOverlay: () => Record<string, unknown>
}): Record<string, unknown> | undefined {
  if (args.variant === 'trainedTeachers') return undefined
  if (args.variant === 'economy') {
    return args.companySchoolOverlay ?? { ...args.readStoreOverlay() }
  }
  if (args.variant === 'general' && args.createProgramOverlay != null) {
    return args.createProgramOverlay
  }
  return { ...args.readStoreOverlay() }
}
