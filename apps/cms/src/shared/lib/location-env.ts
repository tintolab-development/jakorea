import { JUSO_ADDR_LINK_API_URL } from '@jakorea/location/juso'

/**
 * 주소 검색(행안부) 미설정 — 화면에는 관리자용 문구만 보여 준다 (QA-0008·0009와 같은 방식).
 * 내부 경로·환경변수 이름은 노출하지 않고, 개발 환경 콘솔에만 남긴다.
 */
const CMS_ADDRESS_SEARCH_UNAVAILABLE_MESSAGE =
  '주소 검색을 이용할 수 없습니다. 담당자에게 문의해 주세요.'

const CMS_JUSO_MISSING_KEY_DEV_HINT =
  '[location-env] 행안부 주소 API 승인키가 없습니다. apps/cms/.env(또는 .env.local)에 VITE_ADDRESS_API_KEY 또는 VITE_JUSO_CONFM_KEY를 넣은 뒤 개발 서버를 재시작하세요.'

/**
 * 학교·대학교 검색(NEIS·커리어넷) 미설정 — 화면에는 관리자용 문구만 보여 준다 (QA-0008, QA-0009).
 * 내부 경로·환경변수 이름은 노출하지 않고, 개발 환경 콘솔에만 남긴다.
 */
export const CMS_SCHOOL_SEARCH_UNAVAILABLE_MESSAGE =
  '학교 검색을 이용할 수 없습니다. 담당자에게 문의해 주세요.'

const CMS_NEIS_MISSING_KEY_DEV_HINT =
  '[location-env] NEIS API 키가 없습니다. apps/cms/.env(또는 .env.local)에 VITE_NEIS_API_KEY를 넣은 뒤 개발 서버를 재시작하세요.'

const CMS_CAREER_NET_MISSING_KEY_DEV_HINT =
  '[location-env] 커리어넷 API 키가 없습니다. apps/cms/.env(또는 .env.local)에 VITE_CAREER_NET_API_KEY(또는 VITE_CAREEAR_NET_API_KEY)를 넣은 뒤 개발 서버를 재시작하세요.'

const warnedDevHints = new Set<string>()

/** 개발 환경에서만, 같은 안내는 한 번만 콘솔에 남긴다 */
function warnMissingKeyInDev(hint: string): void {
  if (!import.meta.env.DEV || warnedDevHints.has(hint)) return
  warnedDevHints.add(hint)
  console.warn(hint)
}

export function readJusoConfmKeyFromEnv(): string {
  const addressApiKey = import.meta.env.VITE_ADDRESS_API_KEY
  const jusoConfmKey = import.meta.env.VITE_JUSO_CONFM_KEY

  const key = String(addressApiKey ?? jusoConfmKey ?? '').trim()
  if (!key) warnMissingKeyInDev(CMS_JUSO_MISSING_KEY_DEV_HINT)
  return key
}

export function readJusoApiUrlFromEnv(): string {
  const apiUrl = import.meta.env.VITE_JUSO_ADDRESS_API_URL

  return String(apiUrl ?? JUSO_ADDR_LINK_API_URL).trim()
}

export function readNeisApiKeyFromEnv(): string {
  const key = String(import.meta.env.VITE_NEIS_API_KEY ?? '').trim()
  if (!key) warnMissingKeyInDev(CMS_NEIS_MISSING_KEY_DEV_HINT)
  return key
}

/** 커리어넷 OpenAPI 키 — 정식 `VITE_CAREER_NET_API_KEY` 우선, 기존 오타 env도 허용 */
export function readCareerNetApiKeyFromEnv(): string {
  const primary = import.meta.env.VITE_CAREER_NET_API_KEY
  const legacyTypo = import.meta.env.VITE_CAREEAR_NET_API_KEY
  const key = String(primary ?? legacyTypo ?? '').trim()
  if (!key) warnMissingKeyInDev(CMS_CAREER_NET_MISSING_KEY_DEV_HINT)
  return key
}

export function getCmsJusoMissingKeyMessage(): string {
  return CMS_ADDRESS_SEARCH_UNAVAILABLE_MESSAGE
}

export function getCmsNeisMissingKeyMessage(): string {
  return CMS_SCHOOL_SEARCH_UNAVAILABLE_MESSAGE
}

export function getCmsCareerNetMissingKeyMessage(): string {
  return CMS_SCHOOL_SEARCH_UNAVAILABLE_MESSAGE
}
