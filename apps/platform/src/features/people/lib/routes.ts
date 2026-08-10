import { PEOPLE_PATH } from './constants'

export function isPeoplePath(pathname: string) {
  return pathname === PEOPLE_PATH || pathname.startsWith(`${PEOPLE_PATH}/`)
}
