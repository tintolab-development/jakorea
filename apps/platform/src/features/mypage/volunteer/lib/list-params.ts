import type { EducationApplicationListParams } from '../../education/applications/model/types'
import { DEFAULT_EDUCATION_APPLICATION_LIST_PARAMS } from '../../education/applications/lib/list-params'
import { MYPAGE_VOLUNTEER_PATH } from '../../lib/constants'

export function buildVolunteerApplicationListPath(params: EducationApplicationListParams) {
  const searchParams = new URLSearchParams()

  if (params.tab !== DEFAULT_EDUCATION_APPLICATION_LIST_PARAMS.tab) {
    searchParams.set('tab', params.tab)
  }
  if (params.page !== DEFAULT_EDUCATION_APPLICATION_LIST_PARAMS.page) {
    searchParams.set('page', String(params.page))
  }

  const query = searchParams.toString()
  return query ? `${MYPAGE_VOLUNTEER_PATH}?${query}` : MYPAGE_VOLUNTEER_PATH
}

export function isVolunteerApplicationListPath(path: string) {
  const [pathname] = path.split('?')
  return pathname === MYPAGE_VOLUNTEER_PATH
}

export function resolveVolunteerListBackPath(state: unknown) {
  if (state && typeof state === 'object' && 'volunteerListPath' in state) {
    const listPath = (state as { volunteerListPath?: string }).volunteerListPath
    if (typeof listPath === 'string' && isVolunteerApplicationListPath(listPath)) {
      return listPath
    }
  }

  return MYPAGE_VOLUNTEER_PATH
}
