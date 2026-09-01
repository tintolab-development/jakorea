/**
 * UI 시/도 선택값 → 커리어넷 `region` 코드
 * @see https://www.career.go.kr/cnet/front/openapi/openApiSchoolCenter.do
 */

import { CAREER_NET_REGION_CODES } from './constants'

/** UI 시/도명을 커리어넷 region 코드로 변환한다. 매핑 없으면 `undefined`. */
export function resolveCareerNetRegionCode(sido: string): string | undefined {
  const trimmed = sido.trim()
  if (!trimmed) return undefined
  return CAREER_NET_REGION_CODES[trimmed]
}
