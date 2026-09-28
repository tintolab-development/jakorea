import { EDUCATION_CAREER_PATH } from './constants'

export function isEducationCareerPath(pathname: string) {
  return pathname === EDUCATION_CAREER_PATH || pathname.startsWith(`${EDUCATION_CAREER_PATH}/`)
}
