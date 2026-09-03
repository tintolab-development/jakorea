/**
 * 클라이언트 다운로드 → POST /api/admin/logs/file-access/client 여부.
 *
 * BE handoff 대기 중: 기본 false (원격 호출 안 함 → 다운로드 405 방지).
 * 스테이징에 client API 배포·OpenAPI 반영 후 true 조건 복구.
 *
 * @see apps/cms/docs/api/client-file-access-log-backend-handoff.md
 */

export function shouldRecordFileAccessRemotely(): boolean {
  // BE `POST .../file-access/client` 미배포 — stub만 사용
  return false
}
