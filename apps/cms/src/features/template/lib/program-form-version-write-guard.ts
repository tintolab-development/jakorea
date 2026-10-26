/**
 * 프로그램 흐름(등록 위저드·상세 양식 저장)에서 양식 버전에 쓰기 전 안전장치.
 *
 * 공용 데이터 보호(2026-10-25 사고 후속):
 * - 자동 적용 바인딩은 공용 카탈로그 버전(template_scope=CATALOG)을 가리킨다.
 * - 버전 상태 필드는 API 계약상 `versionStatus`다. 구버전 응답 호환으로 `status`도 읽지만,
 *   둘 다 없으면 "상태 불명"으로 보고 COPY한다.
 * - 프로그램 흐름은 **프로그램 전용 COPY**(template_scope=PROGRAM, owner_program_id=이 프로그램)에만
 *   PUT/publish한다. 응답에 소유 정보(templateScope·ownerProgramId)가 없으면 판단할 수 없으므로 COPY한다
 *   (fail-closed). 현재 BE 버전 응답에는 소유 정보가 없으므로 사실상 **항상 COPY**한다.
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

export function readFormVersionStatus(version: ProgramFormVersionWriteCandidate): string | null {
  const raw = version.versionStatus ?? version.status
  return typeof raw === 'string' && raw.trim() !== '' ? raw.trim().toUpperCase() : null
}

export function canWriteProgramFormVersionInPlace(
  version: ProgramFormVersionWriteCandidate,
  options: { catalogTemplateId?: number | null; programId?: number | string | null; forceCopy?: boolean }
): boolean {
  if (options.forceCopy === true) return false
  if (readFormVersionStatus(version) !== 'DRAFT') return false
  if ((version.activeBindingCount ?? 0) > 1) return false
  if (version.templateId == null) return false
  if (options.catalogTemplateId == null) return false
  if (version.templateId === options.catalogTemplateId) return false
  // 소유 정보가 명시적으로 이 프로그램 전용 COPY일 때만 제자리 쓰기를 허용한다.
  if (version.templateScope !== 'PROGRAM') return false
  if (options.programId == null || version.ownerProgramId == null) return false
  if (String(version.ownerProgramId) !== String(options.programId)) return false
  return true
}

export class SharedFormVersionWriteBlockedError extends Error {
  constructor(versionId: number) {
    super(
      `공용 또는 발행된 양식 버전(${versionId})에는 프로그램 화면에서 직접 저장할 수 없습니다. 프로그램 전용 복사본으로 저장해 주세요.`
    )
    this.name = 'SharedFormVersionWriteBlockedError'
  }
}
