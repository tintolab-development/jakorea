/**
 * Homepage Admin Axios 클라이언트 (Phase 1 — 인증 인터셉터는 이후 Phase에서 추가)
 */

import { getApiBaseUrl } from '@/shared/lib/api-remote-env'
import axios from 'axios'

export const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

const ngrokSkip = import.meta.env.VITE_NGROK_SKIP_BROWSER_WARNING?.trim()
if (ngrokSkip) {
  axiosInstance.defaults.headers.common['ngrok-skip-browser-warning'] = ngrokSkip
}
