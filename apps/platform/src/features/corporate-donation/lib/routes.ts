import { CORPORATE_DONATION_PATH } from './constants'

export function isCorporateDonationPath(pathname: string) {
  return (
    pathname === CORPORATE_DONATION_PATH ||
    pathname.startsWith(`${CORPORATE_DONATION_PATH}/`)
  )
}
