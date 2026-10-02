import dayjs from 'dayjs'
import type {
  UjatAssignmentSubmissionDocumentDto,
  UjatAssignmentSubmissionListResponse,
  UjatAssignmentSubmissionVolunteerDto,
} from '@/features/program/ujat/api/education-execution-api'
import {
  filterVisibleAssignmentVolunteers,
  formatAssignmentDateLabel,
} from '@/features/program/ujat/ui/detail-modal/progress/assignments/assignment-display'
import type { EducationProgressHalfKey } from '@/features/program/ujat/ui/detail-modal/progress/tabs'
import type { UjatInstitutionApplicationRegionKey } from '@/features/program/ujat/ui/detail-modal/application-institution/list/regions'
import type {
  UjatAssignmentReportState,
  UjatAssignmentReportStatus,
  UjatAssignmentSessionGroup,
  UjatAssignmentVolunteerRow,
} from '@/features/program/ujat/ui/detail-modal/progress/assignments/types'

function formatShortDate(value?: string | null): string | undefined {
  if (!value?.trim()) return undefined
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YY.MM.DD') : value.trim()
}

function formatPeriodLabel(start?: string | null, end?: string | null): string {
  const startLabel = start ? dayjs(start) : null
  const endLabel = end ? dayjs(end) : null
  const startText = startLabel?.isValid() ? startLabel.format('YYYY.MM.DD') : ''
  const endText = endLabel?.isValid() ? endLabel.format('YYYY.MM.DD') : ''
  if (startText && endText) return `${startText} ~ ${endText}`
  return startText || endText || '-'
}

function mapDocumentStatus(status?: string | null): UjatAssignmentReportStatus {
  const normalized = (status ?? '').trim().toUpperCase()
  if (normalized === 'SUBMITTED') return 'submitted'
  if (normalized === 'DEADLINE_MISSED') return 'deadline_missed'
  if (normalized === 'REVISED') return 'revised'
  return 'not_submitted'
}

function mapDocument(doc?: UjatAssignmentSubmissionDocumentDto | null): UjatAssignmentReportState {
  return {
    status: mapDocumentStatus(doc?.status),
    submittedDateLabel: formatShortDate(doc?.submittedAt),
    feedbackDeliveredDateLabel: formatShortDate(doc?.feedbackDeliveredAt),
    formResponseId:
      typeof doc?.formResponseId === 'number' && Number.isFinite(doc.formResponseId)
        ? doc.formResponseId
        : undefined,
  }
}

function mapVolunteer(
  volunteer: UjatAssignmentSubmissionVolunteerDto,
  scheduleId: string
): UjatAssignmentVolunteerRow {
  const participantId = String(volunteer.participantId ?? '')
  return {
    id: `${scheduleId}-${participantId || 'unknown'}`,
    name: volunteer.memberName?.trim() || `봉사자 ${participantId}`,
    institutionName: volunteer.institutionName?.trim() || '-',
    assignedClass: volunteer.assignedClass?.trim() || '-',
    plan: mapDocument(volunteer.plan),
    log: mapDocument(volunteer.log),
    isDropout: volunteer.isDropout === true,
    hasProgressHistory: volunteer.hasProgressHistory === true,
  }
}

export function buildUjatAssignmentSessionsFromRemote(params: {
  data: UjatAssignmentSubmissionListResponse
  half: EducationProgressHalfKey
  regionKey: UjatInstitutionApplicationRegionKey
}): UjatAssignmentSessionGroup[] {
  return (params.data.items ?? [])
    .filter(day => day.isoDate?.trim())
    .map(day => {
      const isoDate = day.isoDate!.trim()
      const scheduleId = day.scheduleId != null ? String(day.scheduleId) : isoDate
      const volunteers = filterVisibleAssignmentVolunteers(
        (day.volunteers ?? []).map(volunteer => mapVolunteer(volunteer, scheduleId))
      )
      return {
        id: scheduleId,
        regionKey: params.regionKey,
        half: params.half,
        isoDate,
        dateLabel: formatAssignmentDateLabel(isoDate),
        planSubmissionPeriodLabel: formatPeriodLabel(
          day.planSubmissionPeriodStart,
          day.planSubmissionPeriodEnd
        ),
        logSubmissionPeriodLabel: formatPeriodLabel(
          day.logSubmissionPeriodStart,
          day.logSubmissionPeriodEnd
        ),
        volunteers,
      }
    })
}
