import copyStyles from './auth-page-copy.module.css'

export const authPageCopy = {
  title: copyStyles.pageTitle,
  description: copyStyles.pageDescription,
} as const

export function authPageCopyClass(
  role: keyof typeof authPageCopy,
  ...extra: Array<string | undefined | false | null>
) {
  return [authPageCopy[role], ...extra].filter(Boolean).join(' ')
}
