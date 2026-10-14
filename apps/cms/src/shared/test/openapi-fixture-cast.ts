/** OpenAPI 생성 DTO 테스트 fixture — 필수 필드는 런타임 검증 대상이 아닐 때만 사용 */
export function asOpenApiFixture<T>(value: unknown): T {
  return value as T
}
