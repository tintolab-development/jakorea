import { TALENT_DONATION_APPLY_PATH, TALENT_DONATION_PATH } from './constants'

export function isTalentDonationPath(pathname: string) {
  return (
    pathname === TALENT_DONATION_PATH ||
    pathname.startsWith(`${TALENT_DONATION_PATH}/`)
  )
}

export function isTalentDonationApplyPath(pathname: string) {
  return pathname === TALENT_DONATION_APPLY_PATH
}
