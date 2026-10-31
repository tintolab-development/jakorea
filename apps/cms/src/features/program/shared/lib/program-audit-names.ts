export type ProgramAuditNameFields = {
  createdByName?: string
  updatedByName?: string
}

/** OpenAPI ProgramResponse codegen 전까지 GET/POST/PATCH 최상위 와이어. null은 표시명 없음. */
export type ProgramAuditNameWire = {
  createdByName?: string | null
  updatedByName?: string | null
}

function readTrimmedName(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

/** GET/POST/PATCH 최상위 JSON의 등록자·수정자. OpenAPI ProgramResponse에 없어도 키가 있으면 읽는다. serviceDetailJson·overlay는 보지 않는다. */
export function readProgramAuditNames(dto: unknown): ProgramAuditNameFields {
  if (dto == null || typeof dto !== 'object') return {}
  const record = dto as Record<string, unknown>
  const createdByName = readTrimmedName(record.createdByName)
  const updatedByName = readTrimmedName(record.updatedByName)
  return {
    ...(createdByName ? { createdByName } : {}),
    ...(updatedByName ? { updatedByName } : {}),
  }
}

/** PATCH `/api/admin/programs/{id}` 낙관적 잠금. GET `updatedAt`이 있을 때만 실어 보낸다. */
export function withExpectedUpdatedAt<T extends object>(
  body: T,
  updatedAt: string | null | undefined
): T & { expectedUpdatedAt?: string } {
  const expectedUpdatedAt = updatedAt?.trim()
  if (!expectedUpdatedAt) return body
  return { ...body, expectedUpdatedAt }
}

/** JSON 파싱 결과를 Program에 펼칠 때 등록자·수정자를 최상위 응답으로만 남긴다. */
export function omitProgramAuditNameFields<T extends object>(
  source: T
): Omit<T, 'createdByName' | 'updatedByName'> {
  const next = { ...source } as T & ProgramAuditNameFields
  delete next.createdByName
  delete next.updatedByName
  return next
}
