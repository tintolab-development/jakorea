import { DIRECTIONS_PATH } from './constants'

export function isDirectionsPath(pathname: string) {
  return pathname === DIRECTIONS_PATH || pathname.startsWith(`${DIRECTIONS_PATH}/`)
}
