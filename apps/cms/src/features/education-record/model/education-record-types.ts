/**
 * 실적 관리 목록 페이지용 pending 필터 · 테이블 컨텍스트 · 합계 탭 타입
 */

export type EducationRecordQuarter = 1 | 2 | 3 | 4

export type EducationRecordPendingFilters = {
  /** 연도 (YYYY). 빈 문자열이면 전체 */
  year: string
  /** 분기 (1 ~ 4 또는 `'ALL'`) */
  quarter: 'ALL' | EducationRecordQuarter
  /** 시/도 이름 (예: `'서울특별시'`). 빈 문자열이면 전체 */
  sido: string
  /** 시/군/구 이름 (예: `'강남구'`). 빈 문자열이면 전체 */
  sigungu: string
  /** 후원사명 검색어(국문 부분일치) */
  sponsorName: string
  /** 대표 프로그램명 검색어 */
  mainTitle: string
  /** 세부 프로그램명 검색어 */
  title: string
  /** 교재명 검색어(국문 부분일치) */
  textbookName: string
}

export type EducationRecordTableContext = {
  /** select 옵션용 연도 집합 (내림차순) */
  availableYears: number[]
}

/** 실적 관리 페이지 탭 키 */
export type EducationRecordTabKey = 'data' | 'summary'

/** 합계 탭 카테고리 키 */
export type SummaryCategoryKey =
  | 'economyFinance'
  | 'careerEmployment'
  | 'entrepreneurship'
  | 'digitalLiteracy'

/** 합계 탭 서브 행 키 (카테고리에 따라 일부만 사용) */
export type SummarySubRowKey =
  | 'elementary'
  | 'middle'
  | 'high'
  | 'university'
  | 'adult'
  | 'total'

/** 합계 탭 미니 테이블 1행 수치 */
export type SummaryRow = {
  /** 개수 : 학교명 */
  schoolCount: number
  /** 개수 : 학급수 */
  classCount: number
  /** 합계 : 총 참가자 */
  participants: number
  /** 합계 : 교육시간 */
  educationHours: number
  /** 합계 : 일반자원봉사자 */
  generalVolunteers: number
  /** 합계 : 임직원자원봉사자 */
  staffVolunteers: number
  /** 합계 : 일반담당교사 */
  generalTeachers: number
  /** 합계 : 교육받은교사 */
  educatedTeachers: number
  /** 합계 : 강사 */
  instructors: number
}

/** 합계 테이블 컬럼 키 — `SummaryRow`의 키와 1:1 매핑 */
export type SummaryColumnKey = keyof SummaryRow
