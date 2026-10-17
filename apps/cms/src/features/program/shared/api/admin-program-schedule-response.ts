import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import type { ProgramScheduleCanonicalFields } from '@/features/program/shared/lib/program-schedule-canonical'

/**
 * GET/PUT `/api/admin/programs/{programId}/schedules` — OpenAPI codegen 확장 전 FE SSOT.
 * Orval `ProgramScheduleResponse` + canonical education slot 필드.
 */
export type AdminProgramScheduleResponse = ProgramScheduleResponse &
  ProgramScheduleCanonicalFields
