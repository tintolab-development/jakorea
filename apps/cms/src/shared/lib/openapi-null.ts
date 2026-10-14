/** OpenAPI `nullable` → TS `T | null` 필드를 FE optional(`undefined`)로 정규화 */
export function nullToUndefined<T>(value: T | null | undefined): T | undefined {
  return value === null ? undefined : value
}

/** Program CREATE 등 — Update DTO에서 null이 섞인 필드를 요청 body에서 제거 */
export function omitNullRecordValues<T extends Record<string, unknown>>(record: T): T {
  const out = { ...record }
  for (const key of Object.keys(out) as (keyof T)[]) {
    if (out[key] === null) {
      delete out[key]
    }
  }
  return out
}
