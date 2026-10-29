/**
 * 프로그램 흐름(등록 위저드·상세 양식 저장)에서 양식 버전에 쓰기 전 안전장치.
 *
 * 공용 데이터 보호(2026-10-25 사고 후속) + UJAT COPY 계약:
 * - write-guard SSOT는 GET version의 `templateScope` · `ownerProgramId`다.
 * - CATALOG(또는 소유 정보 없는 카탈로그 원본)만 `versions/copy`(ownerProgramId)로 프로그램 전용본을 만든다.
 * - PROGRAM + 이 프로그램 소유 DRAFT만 제자리 PUT. PUBLISHED/ARCHIVED는 같은 템플릿에 버전 추가.
 * - PROGRAM/COPY 템플릿에 copyVersion을 다시 치면 400이다.
 * - 필드가 없는 구버전 응답만 catalog templateId 비교로 우회한다.
 * - 양식 관리·설문 템플릿 편집 화면(의도된 공용 템플릿 편집)은 이 가드를 쓰지 않는다.
 */
export type ProgramFormVersionWriteCandidate = {
  templateId?: number | null
  versionStatus?: string | null
  /** 구버전/비정형 응답 호환 */
  status?: string | null
  activeBindingCount?: number | null
  templateScope?: string | null
  ownerProgramId?: number | string | null
}

export type ProgramFormWritePlan =
  | { action: 'write-in-place' }
  | { action: 'copy-from-catalog' }
  | { action: 'create-draft-version' }

export function readFormVersionStatus(version: ProgramFormVersionWriteCandidate): string | null {
  const raw = version.versionStatus ?? version.status
  return typeof raw === 'string' && raw.trim() !== '' ? raw.trim().toUpperCase() : null
}

export function readFormTemplateScope(version: ProgramFormVersionWriteCandidate): string | null {
  const raw = version.templateScope
  return typeof raw === 'string' && raw.trim() !== '' ? raw.trim().toUpperCase() : null
}

function isOwnedByProgram(
  version: ProgramFormVersionWriteCandidate,
  programId: number | string | null | undefined
): boolean {
  if (programId == null || version.ownerProgramId == null) return false
  return String(version.ownerProgramId) === String(programId)
}

function isLegacyResponse(version: ProgramFormVersionWriteCandidate): boolean {
  return readFormTemplateScope(version) == null && version.ownerProgramId == null
}

/**
 * 제자리 PUT 가능 여부. `resolveProgramFormWritePlan`의 write-in-place와 같다.
 */
export function canWriteProgramFormVersionInPlace(
  version: ProgramFormVersionWriteCandidate,
  options: {
    catalogTemplateId?: number | null
    programId?: number | string | null
    forceCopy?: boolean
  }
): boolean {
  return resolveProgramFormWritePlan(version, options).action === 'write-in-place'
}

export function resolveProgramFormWritePlan(
  version: ProgramFormVersionWriteCandidate,
  options: {
    catalogTemplateId?: number | null
    programId?: number | string | null
    forceCopy?: boolean
  }
): ProgramFormWritePlan {
  if (options.forceCopy === true) return { action: 'copy-from-catalog' }

  const scope = readFormTemplateScope(version)
  const status = readFormVersionStatus(version)
  const owned = isOwnedByProgram(version, options.programId)

  if (scope === 'PROGRAM' && owned) {
    return status === 'DRAFT' ? { action: 'write-in-place' } : { action: 'create-draft-version' }
  }
  if (scope === 'PROGRAM' || scope === 'COPY') {
    return { action: 'create-draft-version' }
  }
  if (scope === 'CATALOG') {
    return { action: 'copy-from-catalog' }
  }

  // 구버전: templateScope·ownerProgramId 없음 → catalog templateId 비교만.
  if (isLegacyResponse(version)) {
    if (
      options.catalogTemplateId != null &&
      version.templateId != null &&
      version.templateId !== options.catalogTemplateId
    ) {
      return status === 'DRAFT' ? { action: 'write-in-place' } : { action: 'create-draft-version' }
    }
    return { action: 'copy-from-catalog' }
  }

  if (owned && status === 'DRAFT') return { action: 'write-in-place' }
  if (owned) return { action: 'create-draft-version' }
  return { action: 'copy-from-catalog' }
}

export class SharedFormVersionWriteBlockedError extends Error {
  constructor(versionId: number) {
    super(
      `공용 또는 발행된 양식 버전(${versionId})에는 프로그램 화면에서 직접 저장할 수 없습니다. 프로그램 전용 복사본으로 저장해 주세요.`
    )
    this.name = 'SharedFormVersionWriteBlockedError'
  }
}
