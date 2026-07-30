/** 커리어넷 OpenAPI — 학교·학과 등 공통 엔드포인트 */
export const CAREER_NET_OPEN_API_URL = 'https://www.career.go.kr/cnet/openapi/getOpenApi'

/** 학교 분류 — 대학교 검색 시 고정 */
export const CAREER_NET_GUBUN_UNIVERSITY = '대학교' as const

/** 학교유형1(대학교) — sch1 */
export const CAREER_NET_UNIV_SCH1 = {
  all: '',
  college: '100322', // 전문대학
  university4: '100323', // 대학(4년제)
} as const

/**
 * UI 시/도명 → 커리어넷 `region` 코드
 * @see https://www.career.go.kr/cnet/front/openapi/openApiSchoolCenter.do
 */
export const CAREER_NET_REGION_CODES: Record<string, string> = {
  서울특별시: '100260',
  부산광역시: '100267',
  대구광역시: '100272',
  인천광역시: '100269',
  광주광역시: '112691',
  대전광역시: '100271',
  울산광역시: '100273',
  세종특별자치시: '100704',
  경기도: '100276',
  강원도: '100278',
  강원특별자치도: '100278',
  충청북도: '100280',
  충청남도: '100281',
  전라북도: '100282',
  전북특별자치도: '100282',
  전라남도: '112691',
  경상북도: '100285',
  경상남도: '100291',
  제주도: '100292',
  제주특별자치도: '100292',
}
