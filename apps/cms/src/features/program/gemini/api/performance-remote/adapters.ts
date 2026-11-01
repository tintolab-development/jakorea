import type {
  GeminiPerformanceRow,
  GeminiPerformanceUploadRow,
} from '@/features/program/gemini/model/performance/types'
import type { GeminiTrainingReportImportRow } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportImportRow'
import type { GeminiTrainingReportItem } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportItem'
import {
  toJavaInt,
  toJavaLocalDate,
  toJavaLocalTime,
  toKoreanPhone,
} from '@/features/program/gemini/lib/performance/import-wire-values'
import { isGeminiInstructorIdentityBlank } from '@/features/program/gemini/lib/performance/instructor-identity'
import { isGeminiInstructorIdentityBlankExclusion } from '@/features/program/gemini/lib/performance/payment-exclusion'
import { resolveTrainingMethod } from '@/features/program/gemini/lib/performance/resolve-training-method'

function toId(value: number | string | undefined): string {
  if (value == null) return ''
  return String(value)
}

function dash(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}

function formatClock(raw: string | undefined): string | undefined {
  const trimmed = raw?.trim()
  if (!trimmed) return undefined
  const hm = /^(\d{1,2}):(\d{2})/.exec(trimmed)
  if (!hm) return undefined
  return `${hm[1].padStart(2, '0')}:${hm[2]}`
}

function formatDetailTimeText(dto: GeminiTrainingReportItem): string {
  const start = formatClock(dto.trainingStartTime)
  const end = formatClock(dto.trainingEndTime)
  if (start && end) return `${start} ~ ${end}`
  if (dto.trainingMinutes != null && dto.trainingMinutes > 0) return `${dto.trainingMinutes}분`
  return '-'
}

function resolveListTrainingMethod(
  dto: GeminiTrainingReportItem
): GeminiPerformanceRow['trainingMethod'] {
  const delivery = dto.deliveryType?.trim().toUpperCase()
  if (delivery === 'ONLINE' || delivery === 'OFFLINE') return delivery
  return resolveTrainingMethod(dto.trainingLocation ?? dto.schoolOrOrganizationName ?? '')
}

/**
 * OpenAPI training-report item → FE 실적 행.
 * 서버 필드가 없으면 `-` / null. 프로그램 공통값으로 채우지 않는다.
 */
export function mapGeminiTrainingReportItemToRow(
  dto: GeminiTrainingReportItem,
  index: number
): GeminiPerformanceRow {
  const minutes = dto.trainingMinutes
  const hours =
    minutes != null && minutes > 0 ? Math.round((minutes / 60) * 10) / 10 : null
  const assistantNames = dto.assistantInstructorNames?.trim() || ''
  const instructorNameTrimmed = dto.instructorName?.trim() ?? ''
  const identityBlank = isGeminiInstructorIdentityBlankExclusion(dto.paymentExclusionReason)
  const instructorName = instructorNameTrimmed
    ? instructorNameTrimmed
    : identityBlank
      ? '-'
      : dash(dto.instructorName)
  return {
    id: toId(dto.trainingReportId),
    no: index + 1,
    createdAt: dto.createdAt ?? '',
    duplicateKey: `remote-${toId(dto.trainingReportId)}`,
    trainingLocation: dash(dto.trainingLocation) !== '-' ? dash(dto.trainingLocation) : dash(dto.schoolOrOrganizationName),
    trainingDate: dto.trainingDate ?? '',
    participantCount: dto.participantCount ?? null,
    detailTimeText: formatDetailTimeText(dto),
    trainingHours: hours,
    trainingTopic: dash(dto.topic) !== '-' ? dash(dto.topic) : dash(dto.programNameKo),
    instructorName,
    assistantInstructorNames: dash(assistantNames),
    instructorCount:
      dto.assistantInstructorCount != null
        ? dto.assistantInstructorCount
        : assistantNames
          ? assistantNames.split(/[,，]/).filter(part => part.trim()).length
          : instructorNameTrimmed
            ? 1
            : null,
    trainingFormat: '-',
    trainingMethod: resolveListTrainingMethod(dto),
    contact: '',
    instructorMemberId:
      dto.instructorMemberId != null ? String(dto.instructorMemberId) : undefined,
    calculatedAmount: dto.calculatedAmount ?? null,
    classCount: dto.classCount ?? null,
    paymentExclusionReason: dto.paymentExclusionReason ?? null,
    ...(dto.accountPaymentId != null &&
    Number.isFinite(dto.accountPaymentId) &&
    dto.accountPaymentId > 0
      ? { accountPaymentId: dto.accountPaymentId }
      : {}),
  }
}

export function mapUploadAndDisplayToImportRow(
  upload: GeminiPerformanceUploadRow,
  display: GeminiPerformanceRow
): GeminiTrainingReportImportRow {
  const instructorBlank = isGeminiInstructorIdentityBlank(
    upload.instructorName,
    upload.contact
  )
  const memberId = display.instructorMemberId ? Number(display.instructorMemberId) : undefined

  // 강사명·연락처 모두 미기재 → 신원 필드를 생략해 BE가「실적만」분기로 보낸다.
  // 부분 기재는 필드를 보내 BE가 기존 NAME_AND_PHONE_REQUIRED / NOT_MATCHED로 거절한다.
  const instructorFields: Pick<
    GeminiTrainingReportImportRow,
    'instructorMemberId' | 'instructorEmail' | 'instructorPhone' | 'instructorName'
  > = instructorBlank
    ? {}
    : {
        instructorMemberId:
          memberId != null && Number.isFinite(memberId) ? memberId : undefined,
        instructorEmail: upload.email.trim() || undefined,
        instructorPhone: toKoreanPhone(upload.contact),
        instructorName: upload.instructorName.trim() || undefined,
      }

  return {
    ...instructorFields,
    assistantInstructorNames: upload.assistantInstructorNames.trim() || undefined,
    trainingLocation: upload.trainingLocation.trim() || undefined,
    schoolOrOrganizationName: upload.school.trim() || undefined,
    trainingDate: toJavaLocalDate(display.trainingDate),
    trainingStartTime: toJavaLocalTime(upload.trainingStartTime),
    trainingEndTime: toJavaLocalTime(upload.trainingEndTime),
    trainingSessionCount: toJavaInt(upload.classCount),
    participantCount: toJavaInt(upload.participantCount),
  }
}
