import type { QueryClient } from '@tanstack/react-query'
import type { ProgramRegistrationFormVariant } from '@/features/template/model/program-registration-draft'
import { companySchoolQueryKeys } from '@/features/program/1c-1s/api/query-keys'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { trainedTeacherQueryKeys } from '@/features/program/trained-teachers/api/query-keys'
import { queryKeys as ujatProgramQueryKeys } from '@/features/program/ujat/api/query-keys'
import { geminiVisitingTrainingQueryKeys } from '@/features/program/gemini/api/visiting-training/query-keys'
import { programCalendarQueryKeys } from '@/features/program/general/api/program-calendar-query-keys'

/** 일반 프로그램 — 목록 테이블 + 상단/대시보드 4카드 위젯 */
export function invalidateGeneralProgramListCaches(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.lists() })
  void queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.overviewStages() })
  void queryClient.invalidateQueries({ queryKey: programCalendarQueryKeys.all })
}

/** 1사1교 — 목록 테이블 + 상단/대시보드 4카드 위젯 */
export function invalidateCompanySchoolListCaches(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: companySchoolQueryKeys.lists() })
  void queryClient.invalidateQueries({ queryKey: companySchoolQueryKeys.overviewStages() })
  void queryClient.invalidateQueries({ queryKey: programCalendarQueryKeys.all })
}

/** 교육받은 교사 — 목록 테이블 + 상단/대시보드 4카드 위젯 */
export function invalidateTrainedTeacherListCaches(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: trainedTeacherQueryKeys.lists() })
  void queryClient.invalidateQueries({ queryKey: trainedTeacherQueryKeys.overviewStages() })
  void queryClient.invalidateQueries({ queryKey: programCalendarQueryKeys.all })
}

/** UJAT — 목록 테이블 (상단 overviewStages 위젯 없음) */
export function invalidateUjatProgramListCaches(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ujatProgramQueryKeys.lists() })
}

/** Gemini 찾아가는 연수 모집 — 모집 목록 */
export function invalidateGeminiRecruitmentListCaches(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({
    queryKey: geminiVisitingTrainingQueryKeys.recruitmentList(),
  })
}

/**
 * 등록 위자드가 mutation hook을 거치지 않고 service를 직접 호출할 때
 * 목록·위젯 캐시를 유형별로 무효화한다.
 */
export function invalidateProgramListCachesAfterRegistration(
  queryClient: QueryClient,
  variant: ProgramRegistrationFormVariant
): void {
  if (variant === 'economy') {
    invalidateCompanySchoolListCaches(queryClient)
    return
  }
  if (variant === 'trainedTeachers') {
    invalidateTrainedTeacherListCaches(queryClient)
    return
  }
  invalidateGeneralProgramListCaches(queryClient)
}
