import { JUSO_ADDR_LINK_API_URL } from '@jakorea/location/juso'

const CMS_JUSO_MISSING_KEY_MESSAGE =
  '행안부 주소 API 승인키가 설정되지 않았습니다. apps/cms/.env(또는 .env.local)에 VITE_ADDRESS_API_KEY 또는 VITE_JUSO_CONFM_KEY를 넣은 뒤 개발 서버를 재시작해 주세요.'

const CMS_NEIS_MISSING_KEY_MESSAGE =
  'NEIS API 키가 설정되지 않았습니다. apps/cms/.env(또는 .env.local)에 VITE_NEIS_API_KEY를 넣은 뒤 개발 서버를 재시작해 주세요.'

const CMS_CAREER_NET_MISSING_KEY_MESSAGE =
  '커리어넷 API 키가 설정되지 않았습니다. apps/cms/.env(또는 .env.local)에 VITE_CAREER_NET_API_KEY(또는 VITE_CAREEAR_NET_API_KEY)를 넣은 뒤 개발 서버를 재시작해 주세요.'

export function readJusoConfmKeyFromEnv(): string {
  const addressApiKey = import.meta.env.VITE_ADDRESS_API_KEY
  const jusoConfmKey = import.meta.env.VITE_JUSO_CONFM_KEY

  return String(addressApiKey ?? jusoConfmKey ?? '').trim()
}

export function readJusoApiUrlFromEnv(): string {
  const apiUrl = import.meta.env.VITE_JUSO_ADDRESS_API_URL

  return String(apiUrl ?? JUSO_ADDR_LINK_API_URL).trim()
}

export function readNeisApiKeyFromEnv(): string {
  return String(import.meta.env.VITE_NEIS_API_KEY ?? '').trim()
}

/** 커리어넷 OpenAPI 키 — 정식 `VITE_CAREER_NET_API_KEY` 우선, 기존 오타 env도 허용 */
export function readCareerNetApiKeyFromEnv(): string {
  const primary = import.meta.env.VITE_CAREER_NET_API_KEY
  const legacyTypo = import.meta.env.VITE_CAREEAR_NET_API_KEY
  return String(primary ?? legacyTypo ?? '').trim()
}

export function getCmsJusoMissingKeyMessage(): string {
  return CMS_JUSO_MISSING_KEY_MESSAGE
}

export function getCmsNeisMissingKeyMessage(): string {
  return CMS_NEIS_MISSING_KEY_MESSAGE
}

export function getCmsCareerNetMissingKeyMessage(): string {
  return CMS_CAREER_NET_MISSING_KEY_MESSAGE
}
