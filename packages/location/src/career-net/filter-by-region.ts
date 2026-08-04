import type { CareerNetUniversityItem } from './types'

/** 시/군/구 토큰이 주소·지역 문자열에 포함되는지 필터한다. */
export function filterCareerNetUniversitiesBySigungu(
  universities: CareerNetUniversityItem[],
  sigungu: string,
): CareerNetUniversityItem[] {
  const token = sigungu.trim()
  if (!token) return universities

  return universities.filter(item => {
    const haystack = `${item.address} ${item.region}`
    return haystack.includes(token)
  })
}
