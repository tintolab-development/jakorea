import type { DateValue, UUID } from './index'

export interface PersonalInfoAccessLog {
  id: UUID
  /** 개인정보 열람 대상자 명. OpenAPI 미등재 시 '-' */
  targetName: string
  accessItem: string
  accessPurpose: string
  accessorId: UUID
  accessorName: string
  accessedAt: DateValue
  ipAddress: string
}

export interface PersonalInfoAccessLogFilters {
  accessPurpose?: string
  accessorName?: string
  startDate?: DateValue
  endDate?: DateValue
}

export interface RecordPersonalInfoAccessPayload {
  accessItem: string
  accessPurpose: string
  accessorId?: UUID
  accessorName?: string
  ipAddress?: string
  targetName?: string
}
