import { EDUCATION_DIGITAL_LITERACY_PATH } from './constants'

export function isEducationDigitalLiteracyPath(pathname: string) {
  return (
    pathname === EDUCATION_DIGITAL_LITERACY_PATH ||
    pathname.startsWith(`${EDUCATION_DIGITAL_LITERACY_PATH}/`)
  )
}
