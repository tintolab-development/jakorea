import { EDUCATION_ENTREPRENEURSHIP_PATH } from './constants'

export function isEducationEntrepreneurshipPath(pathname: string) {
  return (
    pathname === EDUCATION_ENTREPRENEURSHIP_PATH ||
    pathname.startsWith(`${EDUCATION_ENTREPRENEURSHIP_PATH}/`)
  )
}
