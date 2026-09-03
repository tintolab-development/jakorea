/**
 * 로그 관리 화면 URL 쿼리 → 백엔드 `params` 맵.
 *
 * OpenAPI 확정안(백엔드 갭 B-1). 서버가 다른 키를 쓰면 이 파일만 수정합니다.
 * - file-access: `fileName`, `userName`, `from`, `to`
 * - privacy-access: `accessPurpose`, `accessorName`, `from`, `to`
 *   (`targetName`은 API 지원이나 기능정의서 필터에 없어 UI에 두지 않음)
 * - system-issues: `userName`, `from`, `to`
 */

export function fileDownloadLogsParamsFromSearchParams(
  searchParams: URLSearchParams
): Record<string, string> {
  const params: Record<string, string> = {}
  const fileName = searchParams.get('fdl_file')?.trim()
  const userName = searchParams.get('fdl_user')?.trim()
  const from = searchParams.get('fdl_from')?.trim()
  const to = searchParams.get('fdl_to')?.trim()
  if (fileName) params.fileName = fileName
  if (userName) params.userName = userName
  if (from) params.from = from
  if (to) params.to = to
  return params
}

export function personalInfoAccessLogsParamsFromSearchParams(
  searchParams: URLSearchParams
): Record<string, string> {
  const params: Record<string, string> = {}
  const accessPurpose = searchParams.get('pia_purpose')?.trim()
  const accessorName = searchParams.get('pia_accessor')?.trim()
  const targetName = searchParams.get('pia_target')?.trim()
  const from = searchParams.get('pia_from')?.trim()
  const to = searchParams.get('pia_to')?.trim()
  if (accessPurpose) params.accessPurpose = accessPurpose
  if (accessorName) params.accessorName = accessorName
  if (targetName) params.targetName = targetName
  if (from) params.from = from
  if (to) params.to = to
  return params
}

export function memberLoginLogsParamsFromSearchParams(
  searchParams: URLSearchParams
): Record<string, string> {
  const params: Record<string, string> = {}
  const adminName = searchParams.get('mlh_name')?.trim()
  const loginId = searchParams.get('mlh_id')?.trim()
  const from = searchParams.get('mlh_from')?.trim()
  const to = searchParams.get('mlh_to')?.trim()
  if (adminName) params.adminName = adminName
  if (loginId) params.loginId = loginId
  if (from) params.from = from
  if (to) params.to = to
  return params
}

export function bugIssueLogsParamsFromSearchParams(
  searchParams: URLSearchParams
): Record<string, string> {
  const params: Record<string, string> = {}
  const userName = searchParams.get('bil_user')?.trim()
  const status = searchParams.get('bil_status')?.trim()
  const severity = searchParams.get('bil_severity')?.trim()
  const from = searchParams.get('bil_from')?.trim()
  const to = searchParams.get('bil_to')?.trim()
  if (userName) params.userName = userName
  if (status) params.status = status
  if (severity) params.severity = severity
  if (from) params.from = from
  if (to) params.to = to
  return params
}
