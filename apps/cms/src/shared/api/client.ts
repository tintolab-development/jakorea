/**
 * API 클라이언트 단일 진입점 — 실서버 연동 시 서비스·훅에서는 여기서 import.
 */

export {
  axiosClient,
  default as apiClient,
  postAuthenticationRefreshToken,
  getApiBaseUrl,
  isRemoteApiConfigured,
  AUTH_REFRESH_TOKEN_KEY,
  type TAxiosHeaders,
  type TErrorResponse,
  type TApiErrorMessage,
} from '@/shared/instance/axios-instance'
