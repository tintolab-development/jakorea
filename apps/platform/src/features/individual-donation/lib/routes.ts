import { INDIVIDUAL_DONATION_PATH } from './constants'

export function isIndividualDonationPath(pathname: string) {
  return (
    pathname === INDIVIDUAL_DONATION_PATH ||
    pathname.startsWith(`${INDIVIDUAL_DONATION_PATH}/`)
  )
}
