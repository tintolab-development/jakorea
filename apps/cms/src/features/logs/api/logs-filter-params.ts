/**
 * 로그 관리 화면 URL 쿼리 → 백엔드 params 맵
 * Phase 0 스모크 후 키 이름 조정 가능
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
  const from = searchParams.get('pia_from')?.trim()
  const to = searchParams.get('pia_to')?.trim()
  if (accessPurpose) params.accessPurpose = accessPurpose
  if (accessorName) params.accessorName = accessorName
  if (from) params.from = from
  if (to) params.to = to
  return params
}

export function bugIssueLogsParamsFromSearchParams(
  searchParams: URLSearchParams
): Record<string, string> {
  const params: Record<string, string> = {}
  const userName = searchParams.get('bil_user')?.trim()
  const from = searchParams.get('bil_from')?.trim()
  const to = searchParams.get('bil_to')?.trim()
  if (userName) params.userName = userName
  if (from) params.from = from
  if (to) params.to = to
  return params
}
