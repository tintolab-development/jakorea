import { EDUCATION_FINANCE_PATH } from './constants'

export function isEducationFinancePath(pathname: string) {
  return pathname === EDUCATION_FINANCE_PATH || pathname.startsWith(`${EDUCATION_FINANCE_PATH}/`)
}
