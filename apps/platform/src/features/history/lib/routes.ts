import { HISTORY_PATH } from './constants'

export function isHistoryPath(pathname: string) {
  return pathname === HISTORY_PATH || pathname.startsWith(`${HISTORY_PATH}/`)
}
