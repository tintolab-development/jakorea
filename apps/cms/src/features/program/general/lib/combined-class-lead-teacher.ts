import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { ApplicantInstitutionDetailSavePayload } from '@/features/program/shared/model/applicant-institution'
import { formatCombinedClassLeadTeacherOptionLabel } from '@/features/program/general/lib/combined-class-copy'
import { formatInstitutionTeacherInfoForDetail } from '@/features/program/general/lib/institution-application-detail-edit-policy'
import type { SchoolDetailForModal } from '@/features/program/general/model/school-detail-types'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'

export type CombinedClassLeadTeacherCandidate = {
  /** 옵션 value — teacherMemberId 우선, 없으면 rowId */
  value: string
  label: string
  teacherName: string
  educationGrade: string
  teacherMemberId?: number
  teacherPhone?: string
  teacherMobile?: string
  teacherEmail?: string
  sourceRowId: string
}

function parseTeacherInfoParts(teacherInfo?: string): {
  phone?: string
  mobile?: string
  email?: string
} {
  if (!teacherInfo?.trim()) return {}
  const phone = teacherInfo.match(/Tel\s*:\s*([^|]+)/i)?.[1]?.trim()
  const mobile = teacherInfo.match(/M\s*:\s*([^|]+)/i)?.[1]?.trim()
  const email = teacherInfo.match(/E-mail\s*:\s*([^|]+)/i)?.[1]?.trim()
  return { phone, mobile, email }
}

export function buildCombinedClassLeadTeacherCandidatesFromApplicants(
  lead: ApplicantSchoolRow,
  partners: ApplicantSchoolRow[]
): CombinedClassLeadTeacherCandidate[] {
  const rows = [lead, ...partners]
  const seen = new Set<string>()
  const candidates: CombinedClassLeadTeacherCandidate[] = []

  for (const row of rows) {
    const teacherName = row.teacherName?.trim() || row.detail?.teacherInfo?.split('|')[0]?.replace(/^담당 교사\s*:\s*/, '').trim()
    if (!teacherName) continue
    const value =
      row.teacherMemberId != null ? String(row.teacherMemberId) : `row:${row.id}`
    if (seen.has(value)) continue
    seen.add(value)
    const parts = parseTeacherInfoParts(row.detail?.teacherInfo)
    candidates.push({
      value,
      label: formatCombinedClassLeadTeacherOptionLabel(teacherName, row.educationGrade),
      teacherName,
      educationGrade: row.educationGrade,
      teacherMemberId: row.teacherMemberId,
      teacherPhone: parts.phone ?? row.contact,
      teacherMobile: parts.mobile,
      teacherEmail: parts.email,
      sourceRowId: row.id,
    })
  }

  return candidates
}

export function buildCombinedClassLeadTeacherCandidatesFromParticipating(
  leadDetail: SchoolDetailForModal,
  leadRow: ParticipatingSchoolRow,
  partnerRows: ParticipatingSchoolRow[],
  partnerDetails?: Record<string, SchoolDetailForModal | undefined>
): CombinedClassLeadTeacherCandidate[] {
  const entries: Array<{
    row: ParticipatingSchoolRow
    detail?: SchoolDetailForModal
  }> = [
    { row: leadRow, detail: leadDetail },
    ...partnerRows.map(row => ({ row, detail: partnerDetails?.[row.id] })),
  ]

  const seen = new Set<string>()
  const candidates: CombinedClassLeadTeacherCandidate[] = []

  for (const { row, detail } of entries) {
    const teacherName = (detail?.teacherName ?? row.teacherName)?.trim()
    if (!teacherName) continue
    const memberId = row.teacherMemberId
    const value = memberId != null ? String(memberId) : `row:${row.id}`
    if (seen.has(value)) continue
    seen.add(value)
    const grade = detail?.educationGrade ?? row.educationGrade ?? ''
    candidates.push({
      value,
      label: formatCombinedClassLeadTeacherOptionLabel(teacherName, grade),
      teacherName,
      educationGrade: grade,
      teacherMemberId: memberId,
      teacherPhone: detail?.teacherPhone,
      teacherMobile: detail?.teacherMobile,
      teacherEmail: detail?.teacherEmail,
      sourceRowId: row.id,
    })
  }

  return candidates
}

/** mock stub 대체 — 목록 상태에서 합반·교재 동기화 (학년·학급·인원 유지) */
export function applyApplicantInstitutionCombinedClassLocalPatch(
  list: ApplicantSchoolRow[],
  sourceId: string,
  payload: ApplicantInstitutionDetailSavePayload
): ApplicantSchoolRow[] {
  const source = list.find(row => row.id === sourceId)
  if (!source) return []

  const partnerIdSet = new Set(
    payload.combinedClassApplication === '신청' ? payload.combinedClassPartnerApplicantIds : []
  )
  const partnerGrades = list
    .filter(row => partnerIdSet.has(row.id))
    .map(row => row.educationGrade)
    .filter(Boolean)

  return list.map(row => {
    if (row.id === sourceId) {
      return {
        ...row,
        educationGrade: payload.educationGrade || row.educationGrade,
        classCount: payload.classCount,
        studentCount: payload.studentCount,
        teacherName: payload.teacherName?.trim() || row.teacherName,
        contact: payload.contact ?? row.contact,
        adminComment: payload.adminComment ?? row.adminComment,
        detail: {
          ...row.detail,
          addressDetail: payload.addressDetail,
          educationType: payload.educationType,
          applicationReason: payload.applicationReason,
          otherRequests: payload.otherRequests,
          computerInSpace: payload.computerInSpace,
          waitingPlaceGuide: payload.waitingPlaceGuide,
          mealInfo: payload.mealInfo,
          otherSpecialNotes: payload.otherSpecialNotes,
          textbookId: payload.textbookId,
          textbookName: payload.textbookName,
          combinedClassApplication: payload.combinedClassApplication,
          combinedClassPartnerApplicantIds: payload.combinedClassPartnerApplicantIds,
          combinedClassPartnerGrades: partnerGrades,
          teacherInfo: payload.teacherInfo ?? row.detail?.teacherInfo,
        },
      }
    }

    if (payload.combinedClassApplication === '신청' && partnerIdSet.has(row.id)) {
      return {
        ...row,
        detail: {
          ...row.detail,
          textbookId: payload.textbookId || row.detail?.textbookId,
          textbookName: payload.textbookName || row.detail?.textbookName,
          combinedClassApplication: '신청',
          combinedClassPartnerApplicantIds: [sourceId],
          combinedClassPartnerGrades: [source.educationGrade].filter(Boolean),
        },
      }
    }

    if (
      row.detail?.combinedClassApplication === '신청' &&
      (row.detail.combinedClassPartnerApplicantIds?.includes(sourceId) ||
        source.detail?.combinedClassPartnerApplicantIds?.includes(row.id))
    ) {
      return {
        ...row,
        detail: {
          ...row.detail,
          combinedClassApplication: '미신청',
          combinedClassPartnerApplicantIds: [],
          combinedClassPartnerGrades: [],
        },
      }
    }

    return row
  })
}

export function applyCombinedClassLeadTeacherToApplicantRows(
  list: ApplicantSchoolRow[],
  memberRowIds: string[],
  candidate: CombinedClassLeadTeacherCandidate
): ApplicantSchoolRow[] {
  const memberSet = new Set(memberRowIds)
  const teacherInfo = formatInstitutionTeacherInfoForDetail({
    teacherName: candidate.teacherName,
    teacherPhone: candidate.teacherPhone ?? '',
    teacherMobile: candidate.teacherMobile ?? '',
    teacherEmail: candidate.teacherEmail ?? '',
  })

  return list.map(row => {
    if (!memberSet.has(row.id)) return row
    return {
      ...row,
      teacherName: candidate.teacherName,
      teacherMemberId: candidate.teacherMemberId,
      contact: candidate.teacherPhone ?? row.contact,
      detail: {
        ...row.detail,
        teacherInfo,
      },
    }
  })
}

export function applyCombinedClassLeadTeacherToSchoolDetail(
  detail: SchoolDetailForModal,
  candidate: CombinedClassLeadTeacherCandidate
): SchoolDetailForModal {
  return {
    ...detail,
    teacherName: candidate.teacherName,
    teacherPhone: candidate.teacherPhone ?? detail.teacherPhone,
    teacherMobile: candidate.teacherMobile ?? detail.teacherMobile,
    teacherEmail: candidate.teacherEmail ?? detail.teacherEmail,
  }
}
