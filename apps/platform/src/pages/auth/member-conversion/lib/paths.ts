export const MEMBER_CONVERSION_PATH = '/auth/member-conversion'
export const MEMBER_CONVERSION_IDENTITY_PATH = '/auth/member-conversion/identity'
export const MEMBER_CONVERSION_CONFIRM_PATH = '/auth/member-conversion/confirm'
export const MEMBER_CONVERSION_MARKETING_PATH = '/auth/member-conversion/marketing'
export const MEMBER_CONVERSION_COMPLETE_PATH = '/auth/member-conversion/complete'

export function withMemberConversionRedirect(path: string, redirect: string | null) {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) return path
  return `${path}?redirect=${encodeURIComponent(redirect)}`
}

export function readMemberConversionLaterPath(redirect: string | null) {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) return '/'
  if (
    redirect === MEMBER_CONVERSION_PATH ||
    redirect.startsWith(`${MEMBER_CONVERSION_PATH}?`) ||
    redirect === MEMBER_CONVERSION_IDENTITY_PATH ||
    redirect.startsWith(`${MEMBER_CONVERSION_IDENTITY_PATH}?`) ||
    redirect === MEMBER_CONVERSION_CONFIRM_PATH ||
    redirect.startsWith(`${MEMBER_CONVERSION_CONFIRM_PATH}?`) ||
    redirect === MEMBER_CONVERSION_MARKETING_PATH ||
    redirect.startsWith(`${MEMBER_CONVERSION_MARKETING_PATH}?`) ||
    redirect === MEMBER_CONVERSION_COMPLETE_PATH ||
    redirect.startsWith(`${MEMBER_CONVERSION_COMPLETE_PATH}?`)
  ) {
    return '/'
  }
  return redirect
}
