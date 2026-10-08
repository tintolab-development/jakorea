export const PROGRAM_APPLICATION_TYPES = [
  'INDIVIDUAL',
  'ORGANIZATION',
  'INSTRUCTOR',
  'VOLUNTEER',
] as const

export type ProgramApplicationType = (typeof PROGRAM_APPLICATION_TYPES)[number]

/**
 * GET /api/portal/me/program-applications `statusGroup`.
 * `CANCELLED`는 BE에서 deprecated(COMPLETED와 동일) — FE 탭 조회에는 쓰지 않는다.
 */
export type ProgramApplicationStatusGroup =
  | 'WAITING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export type PortalProgramApplicationListQuery = {
  applicationType: ProgramApplicationType
  statusGroup?: ProgramApplicationStatusGroup
  status?: string
  programGroup?: string
  keyword?: string
  from?: string
  to?: string
  page: number
  size: number
}

export type PortalProgramApplicationListItem = {
  applicationId?: number
  applicationType?: string
  programId?: number
  programTitle?: string
  programType?: string
  programGroup?: string
  recruitmentId?: number
  recruitmentType?: string
  applicationStatus?: string
  submittedAt?: string
  updatedAt?: string
  cancellable?: boolean
  thumbnailFileObjectId?: number | null
  participationStatus?: string
  displayStatus?: string
  educationStartAt?: string | null
  educationEndAt?: string | null
  recruitmentStartAt?: string | null
  recruitmentEndAt?: string | null
  nextScheduleAt?: string | null
  progressPercent?: number | null
  unreadNoticeCount?: number
  pendingAssignmentCount?: number
  pendingSurveyCount?: number
  certificateAvailable?: boolean
  availableActions?: string[]
  supplement?: unknown
}

export type PortalProgramApplicationListPage = {
  items?: PortalProgramApplicationListItem[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
}

export type PortalProgramApplicationDetail = PortalProgramApplicationListItem & {
  resultReason?: string | null
  formResponseId?: number
  formBindingId?: number
  templateVersionId?: number
  formResponseStatus?: string
  answers?: Record<string, unknown>
  program?: {
    programId?: number
    title?: string
    programType?: string
    programGroup?: string
    thumbnailFileObjectId?: number | null
    recruitmentStartAt?: string | null
    recruitmentEndAt?: string | null
    educationStartAt?: string | null
    educationEndAt?: string | null
  }
  participation?: {
    status?: string
    completionStatus?: string
  }
  summary?: unknown
  capabilities?: {
    canCancelApplication?: boolean
  }
}
