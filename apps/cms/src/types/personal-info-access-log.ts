import type { DateValue, UUID } from './index'

export interface PersonalInfoAccessLog {
  id: UUID
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
}
