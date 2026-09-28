/**
 * 공개 페이지 pathname → Admin 메뉴 통계 metricCode.
 * 섹션 코드는 Admin `menu-view-stats` 매퍼와 맞춘다.
 * 오시는 길·결과 확인·인증·마이페이지는 표에 없다.
 */

const EXACT_METRICS: Record<string, string> = {
  '/about/introduction': 'JA_ORGANIZATION_VIEW',
  '/about/transparency': 'JA_TRANSPARENCY_VIEW',
  '/about/transparency/annual-reports': 'JA_TRANSPARENCY_ANNUAL_REPORT_LIST_VIEW',
  '/about/transparency/audit-reports': 'JA_TRANSPARENCY_AUDIT_REPORT_LIST_VIEW',
  '/about/people': 'JA_PEOPLE_VIEW',
  '/about/history': 'JA_HISTORY_VIEW',
  '/about/careers': 'JA_RECRUIT_VIEW',
  '/notices': 'JA_KOREA_NOTICE_LIST_VIEW',
  '/impact': 'IMPACT_STORY_LIST_VIEW',
  '/education/career': 'EDU_CAREER_VIEW',
  '/education/finance': 'EDU_ECONOMY_VIEW',
  '/education/entrepreneurship': 'EDU_ENTREPRENEURSHIP_VIEW',
  '/education/digital-literacy': 'EDU_DIGITAL_LITERACY_VIEW',
  '/education/textbooks': 'EDU_MATERIAL_LIST_VIEW',
  '/programs': 'PARTICIPATION_APPLY_VIEW',
  '/support/individual': 'DONATION_PERSONAL_VIEW',
  '/support/corporate': 'DONATION_CORPORATE_VIEW',
  '/support/talent': 'SPONSOR_TALENT_VIEW',
}

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname
}

/** 한 세그먼트 상세만. 신청·문의 같은 하위 경로는 목록 metric으로 올리지 않는다. */
function detailMetric(path: string, listPath: string, metricCode: string): string | null {
  const prefix = `${listPath}/`
  if (!path.startsWith(prefix)) return null
  const rest = path.slice(prefix.length)
  if (!rest || rest.includes('/')) return null
  return metricCode
}

export function metricCodeForPathname(pathname: string): string | null {
  const path = normalizePathname(pathname)
  const exact = EXACT_METRICS[path]
  if (exact) return exact
  return (
    detailMetric(path, '/about/careers', 'JA_RECRUIT_POST_VIEW') ??
    detailMetric(path, '/notices', 'JA_KOREA_NOTICE_DETAIL_VIEW') ??
    detailMetric(path, '/impact', 'IMPACT_STORY_DETAIL_VIEW')
  )
}
