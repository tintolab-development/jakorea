import { TEXTBOOKS_PATH } from './constants'

export function isTextbooksPath(pathname: string) {
  return pathname === TEXTBOOKS_PATH || pathname.startsWith(`${TEXTBOOKS_PATH}/`)
}
