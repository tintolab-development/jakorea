/**
 * 개인 참여자 심사 mock → 봉사자 심사 UI(합격자·2차 면접) 재사용용 어댑터
 */

import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { countInterviewAvailabilitySlots } from '@/features/program/general/lib/interview-availability-utils'

function maskContact(contact: string): string {
  const trimmed = contact.trim()
  if (!trimmed) return '-'
  return trimmed.replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-****-$3')
}

function maskEmail(email: string): string {
  const trimmed = email.trim()
  if (!trimmed) return '-'
  const [local, domain] = trimmed.split('@')
  if (!local || !domain) return trimmed
  const visible = local.slice(0, Math.min(2, local.length))
  return `${visible}***@${domain}`
}

export function mapParticipantToVolunteerScreeningRow(
  row: GeneralIndividualApplicantRow
): GeneralVolunteerApplicantRow {
  const contactRaw = row.detail?.contact?.trim() || '-'
  const emailRaw = row.detail?.email?.trim() || '-'
  const interviewAvailability = row.detail?.interviewAvailability ?? []

  return {
    id: row.id,
    no: row.no,
    name: row.applicantName,
    contact: maskContact(contactRaw),
    email: maskEmail(emailRaw),
    contactRaw,
    emailRaw,
    id1365: row.detail?.id1365 ?? '-',
    scheduleChangeCancelCount: row.detail?.scheduleChangeCancelCount ?? 0,
    applicationType: 'new',
    hasJaVolunteerExperience: false,
    essayIntro: row.detail?.selfIntroduction ?? '-',
    essayEducationExperience: '-',
    essayNecessity: '-',
    essayJaExperience: '-',
    managerAEvaluation: row.managerAEvaluation ?? 'unreviewed',
    managerBEvaluation: row.managerBEvaluation ?? 'unreviewed',
    documentScreeningStatus: row.documentScreeningStatus ?? 'pending',
    interviewSlotCount:
      row.interviewSlotCount ??
      (interviewAvailability.length > 0 ? countInterviewAvailabilitySlots(interviewAvailability) : 0),
    interviewAssignmentStatus: row.interviewAssignmentStatus ?? 'waiting',
    programId: row.programId ?? '',
    englishName: row.applicantName,
    gender: row.detail?.gender ?? '-',
    birthDate: row.detail?.birthDate ?? '-',
    age: row.detail?.age ?? 0,
    universityName: row.affiliation,
    major: row.educationGrade,
    applicationRoute: '-',
    interviewAvailability,
    assignedInterviewDateLabel: row.assignedInterviewDateLabel,
    assignedInterviewTime: row.assignedInterviewTime,
    secondInterviewScreeningStatus: row.secondInterviewScreeningStatus,
    totalScore: row.totalScore,
    managerAScore: row.managerAScore,
    managerBScore: row.managerBScore,
    interviewEvaluationRemark: row.interviewEvaluationRemark,
  }
}

export function mapParticipantsToVolunteerScreeningRows(
  rows: GeneralIndividualApplicantRow[]
): GeneralVolunteerApplicantRow[] {
  return rows.map(mapParticipantToVolunteerScreeningRow)
}
