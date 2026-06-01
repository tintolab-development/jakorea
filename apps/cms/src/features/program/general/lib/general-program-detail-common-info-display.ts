/**
 * 일반 프로그램 상세 — 공통 정보 표시 mock/파생
 */

import type { Program } from '@/types/domain'
import { getGeneralSurveyMenuItems } from '@/features/program/general/lib/general-program-detail-meta'
import {
  GENERAL_PROGRAM_EDUCATION_STRUCTURE_LABELS,
  GENERAL_PROGRAM_SESSION_ROUND_LABELS,
  buildGeneralProgramVariantTitle,
  resolveGeneralProgramVariantFromProgram,
  type GeneralProgramVariant,
} from '@/features/program/general/lib/general-program-variant'
import { TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS } from '@/features/template/lib/template-form-select-options'
import { getGeneralParticipantTypes } from '@/features/program/general/lib/general-program-detail-meta'

const PARTICIPANT_LABEL_BY_VALUE = Object.fromEntries(
  TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS.map(o => [o.value, o.label])
) as Record<string, string>

/** 기관_커리큘럼형_단일 회차 유형 mock id */
export const GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID =
  'general-prog-type-org-curriculum-single' as const

export const GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_VARIANT: GeneralProgramVariant = {
  audience: 'organization',
  educationStructure: 'curriculum',
  sessionRound: 'single',
}

/** 스크린샷·유형 mock — 기관_커리큘럼형_단일 회차 공통 정보 */
export const GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_COMMON_INFO_MOCK: NonNullable<
  Program['generalCommonInfo']
> = {
  announcementTitle: '2026년 한국씨티은행-JA Korea 특별한 JOB담 모집 안내',
  detailedProgramName: '특별한 JOB담',
  sponsorDisplayName: '한국씨티은행',
  sponsorManagementId: 'sponsor-list-131',
  sponsorManagerLine: 'OO팀 이순신 책임 | 010-1234-5678',
  venueDetail: '-',
  educationFormLabel: '온라인',
  ipsTypeSummary: '일정 공통 | Prepare | 해당없음',
  curriculumSessions: [
    {
      sessionLabel: '1차시',
      title: '1단원 나를 알리는 기술',
      description:
        '채용 공고 읽기, 이력서 작성하기 등 취업에 필요한 단계들을 알아봅니다.',
    },
    {
      sessionLabel: '2차시',
      title: '2단원 나를 보여주는 기술',
      description:
        '올바른 면접 태도에 대해 알아보고, 직접 면접 체험을 해보는 시간을 갖습니다.',
    },
  ],
  educationScheduleLines: [
    '26년 4월 20일(월) 9:30 ~ 12:20',
    '26년 4월 27일(월) 13:00 ~ 15:50',
  ],
  wageGradeRows: [
    { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 450,000원' },
    { grade: '2급 강사비', pricing: '1시간 당 | 기본 : 350,000원' },
    { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 250,000원' },
  ],
  paymentItems: '교통비(일반), 숙박비(일반), 자원봉사자 활동비',
  deductionItems: '일용근로자 원천징수세액',
  kpi: {
    finalParticipants: 30,
    instructorCount: 80,
    volunteerCount: 80,
    finalSchools: 100,
    finalClasses: 100,
  },
}

/** 목록·상세 헤더·breadcrumb — `Program.title` (유형 mock은 `일반 프로그램 (기관)_…` 형식) */
export function resolveGeneralProgramDisplayTitle(program: Program): string {
  return program.title?.trim() || '프로그램 상세'
}

export function resolveGeneralProgramListTitle(program: Program): string {
  return resolveGeneralProgramDisplayTitle(program)
}

export function formatGeneralParticipantTypesSummary(program: Program): string {
  return getGeneralParticipantTypes(program)
    .map(t => {
      if (t === 'teacher_instructor') return '강사'
      return PARTICIPANT_LABEL_BY_VALUE[t] ?? t
    })
    .join(', ')
}

export function formatGeneralSurveyItemsSummary(program: Program): string {
  const items = getGeneralSurveyMenuItems(program)
  if (items.length === 0) return '-'
  return items.map(i => i.label).join(', ')
}

export function resolveGeneralProgramCommonInfo(
  program: Program
): NonNullable<Program['generalCommonInfo']> {
  if (program.generalCommonInfo) return program.generalCommonInfo

  if (program.id === GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID) {
    return GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_COMMON_INFO_MOCK
  }

  const variant = resolveGeneralProgramVariantFromProgram(program)
  const educationStructure = variant
    ? GENERAL_PROGRAM_EDUCATION_STRUCTURE_LABELS[variant.educationStructure]
    : '커리큘럼형'
  const sessionRound = variant
    ? GENERAL_PROGRAM_SESSION_ROUND_LABELS[variant.sessionRound]
    : '단일 회차'

  return {
    detailedProgramName: program.textbookName ?? program.teamDivision,
    educationFormLabel: program.type === 'online' ? '온라인' : '오프라인',
    ipsTypeSummary: program.ips ? `일정 공통 | ${program.ips} | 해당없음` : '-',
    curriculumSessions: program.rounds.map((r, i) => ({
      sessionLabel: `${i + 1}차시`,
      title: r.curriculum?.split('|')[0]?.trim() ?? `${i + 1}회차`,
      description: r.curriculum?.includes('|')
        ? r.curriculum.split('|').slice(1).join('|').trim()
        : (r.curriculum ?? '-'),
    })),
    educationScheduleLines: [`${educationStructure} · ${sessionRound} (일정 mock)`],
    wageGradeRows: [
      { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 240,000원' },
    ],
    paymentItems: '교통비 (1사1교), 숙박비, 자원봉사자 활동비',
    deductionItems: '사업소득 3.3%, 기타 소득 8.8%',
    kpi: {
      finalParticipants: program.approvedStudentCount ?? 30,
      instructorCount: program.instructors ?? 80,
      volunteerCount: program.generalVolunteers ?? 80,
      finalSchools: program.participatingSchoolCount ?? 100,
      finalClasses: 100,
    },
  }
}

export function isGeneralOrgCurriculumSingleProgram(program: Program): boolean {
  return program.id === GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID
}

/** `general-programs.ts` seed — 스크린샷 mock 단일 소스 */
export function buildGeneralOrgCurriculumSingleProgramSeedFields(): {
  title: string
  mainTitle: string
  titleEn: string
  generalCommonInfo: NonNullable<Program['generalCommonInfo']>
  approvedStudentCount: number
  instructors: number
  instructorCapacity: number
  generalVolunteers: number
  participatingSchoolCount: number
} {
  const commonInfo = GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_COMMON_INFO_MOCK
  const variantTitle = buildGeneralProgramVariantTitle(GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_VARIANT)
  const kpi = commonInfo.kpi!

  return {
    title: variantTitle,
    mainTitle: '한국씨티은행-JA Korea 특별한 JOB담',
    titleEn: 'Shining Future',
    generalCommonInfo: commonInfo,
    approvedStudentCount: kpi.finalParticipants,
    instructors: kpi.instructorCount,
    instructorCapacity: kpi.instructorCount,
    generalVolunteers: kpi.volunteerCount,
    participatingSchoolCount: kpi.finalSchools,
  }
}
