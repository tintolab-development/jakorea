import copyStyles from './auth-page-copy.module.css'

export const authPageCopy = {
  title: copyStyles.pageTitle,
  description: copyStyles.pageDescription,
  /** 타이틀 위에 일러스트/미디어가 있을 때 title과 함께 사용 */
  titleAfterMedia: copyStyles.pageTitleAfterMedia,
  /** 다음 블록이 상단 여백을 담당할 때 description과 함께 사용 */
  descriptionTight: copyStyles.pageDescriptionTight,
} as const

export function authPageCopyClass(
  role: 'title' | 'description',
  ...extra: Array<string | undefined | false | null>
) {
  return [authPageCopy[role], ...extra].filter(Boolean).join(' ')
}
