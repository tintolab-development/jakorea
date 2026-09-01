import { TRANSPARENCY_PATH } from './constants'

export function isTransparencyPath(pathname: string) {
  return pathname === TRANSPARENCY_PATH || pathname.startsWith(`${TRANSPARENCY_PATH}/`)
}
