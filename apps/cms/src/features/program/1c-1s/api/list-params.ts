import type { AdminProgramsListQuery } from '@/features/program/general/api/programs-api-client'
import { COMPANY_SCHOOL_PROGRAM_API_TYPE } from './adapters'

export interface CompanySchoolListFilters {
  keyword?: string
  periodStatus?: string
  businessYear?: number
}

export function companySchoolListParams(
  filters: CompanySchoolListFilters = {}
): AdminProgramsListQuery {
  return {
    programType: COMPANY_SCHOOL_PROGRAM_API_TYPE,
    keyword: filters.keyword?.trim() || undefined,
    periodStatus: filters.periodStatus,
    businessYear: filters.businessYear,
    page: 0,
    size: 500,
  }
}
