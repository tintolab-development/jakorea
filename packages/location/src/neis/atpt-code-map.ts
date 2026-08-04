/**
 * UI 시/도 선택값(`getSidoOptions`) → NEIS `ATPT_OFCDC_SC_CODE`
 * @see https://open.neis.go.kr/hub/schoolInfo
 */

const SIDO_TO_NEIS_ATPT_CODE: Record<string, string> = {
  서울특별시: 'B10',
  부산광역시: 'C10',
  대구광역시: 'D10',
  인천광역시: 'E10',
  광주광역시: 'F10',
  대전광역시: 'G10',
  울산광역시: 'H10',
  세종특별자치시: 'I10',
  경기도: 'J10',
  강원도: 'K10',
  충청북도: 'M10',
  충청남도: 'N10',
  전라북도: 'P10',
  전라남도: 'Q10',
  경상북도: 'R10',
  경상남도: 'S10',
  제주특별자치도: 'T10',
}

/** UI 시/도명을 NEIS 시도교육청 코드로 변환한다. 매핑 없으면 `undefined`. */
export function resolveNeisAtptOfcdcScCode(sido: string): string | undefined {
  const trimmed = sido.trim()
  if (!trimmed) return undefined

  return SIDO_TO_NEIS_ATPT_CODE[trimmed]
}
