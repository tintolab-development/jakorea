import type { EducationApplicationListParams } from '../../education/applications/model/types'
import { DEFAULT_EDUCATION_APPLICATION_LIST_PARAMS } from '../../education/applications/lib/list-params'
import { MYPAGE_LECTURE_PATH } from '../../lib/constants'

export function buildLectureApplicationListPath(params: EducationApplicationListParams) {
  const searchParams = new URLSearchParams()

  if (params.tab !== DEFAULT_EDUCATION_APPLICATION_LIST_PARAMS.tab) {
    searchParams.set('tab', params.tab)
  }
  if (params.page !== DEFAULT_EDUCATION_APPLICATION_LIST_PARAMS.page) {
    searchParams.set('page', String(params.page))
  }

  const query = searchParams.toString()
  return query ? `${MYPAGE_LECTURE_PATH}?${query}` : MYPAGE_LECTURE_PATH
}

export function isLectureApplicationListPath(path: string) {
  const [pathname] = path.split('?')
  return pathname === MYPAGE_LECTURE_PATH
}

export function resolveLectureListBackPath(state: unknown) {
  if (state && typeof state === 'object' && 'lectureListPath' in state) {
    const listPath = (state as { lectureListPath?: string }).lectureListPath
    if (typeof listPath === 'string' && isLectureApplicationListPath(listPath)) {
      return listPath
    }
  }

  return MYPAGE_LECTURE_PATH
}
