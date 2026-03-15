/**
 * 경제 교육 프로그램 Mock 데이터
 * businessArea가 '경제금융'인 교육 프로그램만 필터링
 */

import type { Program } from '../../types/domain'
import { getEducationPrograms } from './education-programs'

/**
 * 경제 교육 프로그램 필터링
 * 사업분야가 경제금융인 프로그램 (없으면 전체 교육 프로그램 반환)
 */
export function getEconomyPrograms(): Program[] {
  const educationPrograms = getEducationPrograms()
  const economyPrograms = educationPrograms.filter(
    program => program.businessArea === '경제금융'
  )
  return economyPrograms.length > 0 ? economyPrograms : educationPrograms
}
