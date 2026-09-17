/**
 * 이미 쓰인 템플릿명과 겹치지 않게 `이름` → `이름 (1)` → `이름 (2)` … 할당.
 * 베이스명이 비어 있으면 그대로 반환한다.
 */
export function allocateUniqueWritingTemplateName(
  desiredName: string,
  existingNames: Iterable<string>
): string {
  const base = desiredName.trim()
  if (base === '') return desiredName

  const existing = new Set(
    [...existingNames]
      .map(name => name.trim())
      .filter((name): name is string => name !== '')
  )

  if (!existing.has(base)) return base

  for (let n = 1; n < 10_000; n += 1) {
    const candidate = `${base} (${n})`
    if (!existing.has(candidate)) return candidate
  }

  return `${base} (${Date.now()})`
}
