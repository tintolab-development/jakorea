import type { Program } from '@/types/domain'
import { mockPrograms } from '@/data/mock/programs'
import {
  buildProgramRegionMap,
  parseRegionTokens,
  resolveSidoFromSigunguTokens,
  type EducationRecordProgramRegion,
} from '@/features/education-record/lib/education-record-region'
import type { EducationRecordRow } from '@/features/education-record/model/education-record-types'
import type { PerformanceRecordFrontendResponse } from '@/shared/api/generated/performance/schemas'

function parseEducationHours(value?: string | number): number | undefined {
  if (value == null || value === '') return undefined
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  const parsed = Number(String(value).replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : undefined
}

function parsePartnerInvolvement(value?: string | boolean): boolean | string | undefined {
  if (value == null) return undefined
  if (typeof value === 'boolean') return value
  const normalized = value.trim().toLowerCase()
  if (normalized === 'yes' || normalized === 'y' || normalized === 'true') return true
  if (normalized === 'no' || normalized === 'n' || normalized === 'false') return false
  return value
}

function attachRegionFields(row: EducationRecordRow, district?: string): EducationRecordRow {
  const tokens = parseRegionTokens(district)
  const sido = resolveSidoFromSigunguTokens(tokens)
  return {
    ...row,
    district,
    sido,
    si: tokens.si,
    gun: tokens.gun,
    gu: tokens.gu,
  }
}

export function mapPerformanceRecordToRow(
  dto: PerformanceRecordFrontendResponse
): EducationRecordRow {
  const district = dto.district?.trim() || undefined
  return attachRegionFields(
    {
      id: String(dto.id ?? ''),
      educationMonth: dto.educationMonth?.trim() || undefined,
      businessArea: dto.businessArea?.trim() || undefined,
      sponsorNameEn: dto.sponsorNameEn?.trim() || undefined,
      sponsorNameKo: dto.sponsorNameKo?.trim() || undefined,
      titleEn: dto.titleEn?.trim() || undefined,
      mainTitle: dto.mainTitle?.trim() || undefined,
      title: dto.title?.trim() || undefined,
      textbookName: dto.textbookName?.trim() || undefined,
      textbookNameEn: dto.textbookNameEn?.trim() || undefined,
      schoolOrOrganizationName: dto.schoolOrOrganizationName?.trim() || undefined,
      targetLevel: dto.targetLevel?.trim() || undefined,
      ipOwned: dto.ipOwned?.trim() || undefined,
      courseDeliveredBy: dto.courseDeliveredBy?.trim() || undefined,
      partnerInvolvement: parsePartnerInvolvement(dto.partnerInvolvement as string | boolean | undefined),
      institutionType: dto.institutionType?.trim() || undefined,
      ips: dto.ips?.trim() || undefined,
      programCategory: dto.programCategory?.trim() || undefined,
      programChannel: dto.programChannel?.trim() || undefined,
      educationType: dto.educationType?.trim() || undefined,
      educationHours: parseEducationHours(dto.educationHours),
      classCount: dto.classCount,
      maleParticipants: dto.maleParticipants,
      femaleParticipants: dto.femaleParticipants,
      totalParticipants: dto.totalParticipants,
      generalVolunteers: dto.generalVolunteers,
      staffVolunteers: dto.staffVolunteers,
      returningVolunteers: dto.returningVolunteers,
      generalTeachers: dto.generalTeachers,
      educatedTeachers: dto.educatedTeachers,
      instructors: dto.instructors,
      managerName: dto.managerName?.trim() || undefined,
      schoolId: dto.schoolOrOrganizationName?.trim() || undefined,
    },
    district
  )
}

export type SponsorNameLookup = Map<string, { nameKo?: string; nameEn?: string }>

export function mapProgramToEducationRecordRow(
  program: Program,
  regionMap: Map<string, EducationRecordProgramRegion>,
  sponsorLookup?: SponsorNameLookup
): EducationRecordRow {
  const regionInfo = regionMap.get(program.id)
  const sponsor = program.sponsorId ? sponsorLookup?.get(program.sponsorId) : undefined
  const sponsorNameKo = sponsor?.nameKo

  const classCount = program.rounds?.[0]?.classCount
  const startDate =
    program.startDate == null
      ? undefined
      : typeof program.startDate === 'string'
        ? program.startDate
        : program.startDate instanceof Date
          ? program.startDate.toISOString()
          : String(program.startDate)

  return attachRegionFields(
    {
      id: program.id,
      startDate,
      businessArea: program.businessArea,
      sponsorNameEn: sponsor?.nameEn,
      sponsorNameKo: sponsorNameKo || undefined,
      titleEn: program.titleEn,
      mainTitle: program.mainTitle,
      title: program.title,
      textbookName: program.textbookName,
      textbookNameEn: program.textbookNameEn,
      schoolOrOrganizationName: regionInfo?.schoolName,
      targetLevel: program.targetLevel,
      ipOwned: program.ipOwned,
      courseDeliveredBy: program.courseDeliveredBy,
      partnerInvolvement: program.partnerInvolvement,
      institutionType: program.institutionType,
      ips: program.ips ?? undefined,
      programCategory: program.programCategory ?? undefined,
      programChannel: program.programChannel ?? undefined,
      educationType: program.type,
      educationHours: program.educationTime,
      classCount,
      maleParticipants: program.maleParticipants,
      femaleParticipants: program.femaleParticipants,
      totalParticipants: program.totalParticipants,
      generalVolunteers: program.generalVolunteers,
      staffVolunteers: program.staffVolunteers,
      returningVolunteers: program.returningVolunteers,
      generalTeachers: program.generalTeachers,
      educatedTeachers: program.educatedTeachers,
      instructors: program.instructors,
      managerName: program.managerName,
      schoolId: regionInfo?.schoolId ?? program.schoolId,
      sido: regionInfo?.sido,
      si: regionInfo?.si,
      gun: regionInfo?.gun,
      gu: regionInfo?.gu,
      district: regionInfo?.region || program.district,
    },
    regionInfo?.region || program.district
  )
}

export function mapProgramsToEducationRecordRows(
  programs: Program[],
  sponsorLookup?: SponsorNameLookup
): EducationRecordRow[] {
  const regionMap = buildProgramRegionMap()
  return programs.map(program => mapProgramToEducationRecordRow(program, regionMap, sponsorLookup))
}

export function getMockEducationRecordRows(): EducationRecordRow[] {
  return mapProgramsToEducationRecordRows(mockPrograms)
}
