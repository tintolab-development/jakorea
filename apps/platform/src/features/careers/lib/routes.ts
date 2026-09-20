import { CAREERS_PATH } from './constants'

export function isCareersPath(pathname: string) {
  return pathname === CAREERS_PATH || pathname.startsWith(`${CAREERS_PATH}/`)
}
