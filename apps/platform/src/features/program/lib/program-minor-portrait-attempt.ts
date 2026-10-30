/**
 * 만 14세 미만 회원 — 프로그램 신청 시도(attempt)별 초상권 동의 진행 상태.
 *
 * 정책: 미성년 회원은 마이페이지·회원가입 동의와 별개로, 프로그램을 신청할 때마다
 * 보호자 본인인증 → 프로그램 단위 초상권 수집·이용 동의서 작성을 거쳐야 신청서로 갈 수 있다.
 *
 * - 상세 신청 버튼 / 신청서 진입 / 제출 직전 게이트가 같은 시도에서 다시 막지 않도록
 *   sessionStorage(탭 단위)에 진행 상태만 남긴다. localStorage 는 쓰지 않는다.
 * - 보호자 본인인증 토큰은 여기에 저장하지 않는다(라우트 state 로만 전달).
 * - 신청 제출 성공 시 `clearProgramMinorPortraitAttempt` 로 지워 다음 신청에서 다시 받는다.
 *
 * TODO(BE): 서버가 시도별 동의 증빙(신청 단위 freshness)을 확정하면 이 클라이언트 표시는
 * UX 용 캐시로만 남기고, 최종 판단은 제출 응답(`MINOR_PROGRAM_PORTRAIT_CONSENT_REQUIRED` 가칭)에 맡긴다.
 */

const STORAGE_KEY_PREFIX = 'jakorea:program-minor-portrait-attempt:'

export type ProgramMinorPortraitAttempt = {
  /** 보호자 본인인증 완료 시각 (ISO-8601) */
  guardianVerifiedAt: string
  /** 프로그램 초상권 동의서 작성 완료 시각 (ISO-8601) */
  consentCompletedAt?: string
}

type AttemptStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function defaultStorage(): AttemptStorage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null
  } catch {
    return null
  }
}

function normalizeProgramId(programId: string | number | null | undefined): string | null {
  if (programId == null) return null
  const value = String(programId).trim()
  return /^\d+$/.test(value) ? value : null
}

export function programMinorPortraitAttemptStorageKey(
  programId: string | number | null | undefined,
): string | null {
  const id = normalizeProgramId(programId)
  return id ? `${STORAGE_KEY_PREFIX}${id}` : null
}

export function readProgramMinorPortraitAttempt(
  programId: string | number | null | undefined,
  storage: AttemptStorage | null = defaultStorage(),
): ProgramMinorPortraitAttempt | null {
  const key = programMinorPortraitAttemptStorageKey(programId)
  if (!key || !storage) return null
  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ProgramMinorPortraitAttempt> | null
    if (!parsed || typeof parsed.guardianVerifiedAt !== 'string' || !parsed.guardianVerifiedAt) {
      return null
    }
    return {
      guardianVerifiedAt: parsed.guardianVerifiedAt,
      consentCompletedAt:
        typeof parsed.consentCompletedAt === 'string' && parsed.consentCompletedAt
          ? parsed.consentCompletedAt
          : undefined,
    }
  } catch {
    return null
  }
}

function writeAttempt(
  programId: string | number | null | undefined,
  attempt: ProgramMinorPortraitAttempt,
  storage: AttemptStorage | null,
): void {
  const key = programMinorPortraitAttemptStorageKey(programId)
  if (!key || !storage) return
  try {
    storage.setItem(key, JSON.stringify(attempt))
  } catch {
    // 저장 실패(사파리 프라이빗 등) — 게이트가 다시 묻는 쪽으로 안전하게 떨어진다.
  }
}

/** 보호자 본인인증 성공 — 새 시도를 시작한다(이전 동의 완료 표시는 지운다). */
export function markProgramMinorPortraitGuardianVerified(
  programId: string | number | null | undefined,
  verifiedAt: string,
  storage: AttemptStorage | null = defaultStorage(),
): void {
  writeAttempt(programId, { guardianVerifiedAt: verifiedAt }, storage)
}

/** 프로그램 초상권 동의서 작성 완료 — 보호자 본인인증이 먼저 기록돼 있어야 한다. */
export function markProgramMinorPortraitConsentCompleted(
  programId: string | number | null | undefined,
  completedAt: string = new Date().toISOString(),
  storage: AttemptStorage | null = defaultStorage(),
): boolean {
  const current = readProgramMinorPortraitAttempt(programId, storage)
  if (!current) return false
  writeAttempt(programId, { ...current, consentCompletedAt: completedAt }, storage)
  return true
}

/** 이번 시도에서 보호자 본인인증 + 동의서 작성을 모두 마쳤는지 */
export function isProgramMinorPortraitAttemptSatisfied(
  programId: string | number | null | undefined,
  storage: AttemptStorage | null = defaultStorage(),
): boolean {
  const attempt = readProgramMinorPortraitAttempt(programId, storage)
  return Boolean(attempt?.guardianVerifiedAt && attempt.consentCompletedAt)
}

/** 신청 제출 성공(또는 시도 폐기) — 다음 신청에서 다시 동의를 받는다. */
export function clearProgramMinorPortraitAttempt(
  programId: string | number | null | undefined,
  storage: AttemptStorage | null = defaultStorage(),
): void {
  const key = programMinorPortraitAttemptStorageKey(programId)
  if (!key || !storage) return
  try {
    storage.removeItem(key)
  } catch {
    // noop
  }
}
