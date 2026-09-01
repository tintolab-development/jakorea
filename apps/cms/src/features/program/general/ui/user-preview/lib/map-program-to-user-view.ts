/**
 * 일반 프로그램 참여자 모집 — 사용자 미리보기 ViewModel
 */

import type { Program } from '@/types/domain'
import {
  DEFAULT_ADDITIONAL_HTML,
  DEFAULT_PROGRAM_DESCRIPTION,
  DEFAULT_RECRUITMENT_GUIDE,
  formatDateOnly,
  formatDateRange,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { resolveGeneralProgramParticipantRecruitmentDisplay } from '@/features/program/general/lib/participant-recruitment-display'
import {
  GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID,
} from '@/features/program/general/lib/detail-common-info-display'

export const RECRUITMENT_USER_PREVIEW_DESIGN_WIDTH = 1920
export const RECRUITMENT_USER_PREVIEW_PAGE_HEIGHT =
  (RECRUITMENT_USER_PREVIEW_DESIGN_WIDTH * 92) / 65
export const RECRUITMENT_USER_PREVIEW_PLATFORM_HEADER_HEIGHT = 100
export const RECRUITMENT_USER_PREVIEW_MAIN_PADDING_TOP = 100
/** 1920px 디자인 캔버스 최상단(Platform 헤더 상단) 기준 Top 버튼 top 좌표 */
export const RECRUITMENT_USER_PREVIEW_TOP_FAB_OFFSET_FROM_PAGE_TOP = 960
/** Platform 헤더 하단 기준 우측 사이드바(포스터) top까지 거리 */
export const RECRUITMENT_USER_PREVIEW_SIDEBAR_OFFSET_FROM_HEADER_BOTTOM = 190
/** 본문 콘텐츠 하단 ↔ 푸터 상단 간격 */
export const RECRUITMENT_USER_PREVIEW_BODY_FOOTER_GAP = 111

export type RecruitmentUserSpecTone = 'primary' | 'accent-red' | 'accent-blue' | 'default'

export type RecruitmentUserSpecRow = {
  label: string
  value: string
  tone?: RecruitmentUserSpecTone
  isHtml?: boolean
}

export type ParticipantRecruitmentUserViewModel = {
  categoryLabel: string
  title: string
  statusTag: string
  targetTag: string
  formatTag: string
  introParagraphs: string[]
  scheduleSpecs: RecruitmentUserSpecRow[]
  detailSpecs: RecruitmentUserSpecRow[]
  applicationPeriodLabel: string
  attachmentFileNames: string[]
  contactLines: string[]
}

const DEFAULT_APPLICATION_METHOD =
  '해당 페이지의 [신청하기] 클릭 후 항목 상세 기재 후 제출'

const DEFAULT_SELECTION_INFO = `선정기간 : 모집 마감 후 2주 이내
선정방법 : 서류 심사 후 개별 연락`

const DEFAULT_OTHER_NOTES = `자원봉사 시간 인정 (4시간)
수료증 발급`

const DEFAULT_REMARKS = '비고 내용이 들어갑니다.'

const DEFAULT_ATTACHMENTS = [
  '[공고문] 2026년 한국씨티은행-JA Korea 특별한 JOB담 모집 안내.pdf',
  '[신청서] 특별한 JOB담 참가 신청서.hwp',
]

const JOB담_INTRO_PARAGRAPHS = [
  `한국씨티은행과 JA Korea가 함께하는 '특별한 JOB담'은 대학(원)생들에게 실제 현직자와의 만남을 통해 진로 탐색과 취업 역량을 키울 수 있는 기회를 제공하는 프로그램입니다. 참가자들은 멘토링, 모의 면접, 이력서 피드백 등 실질적인 취업 준비 활동에 참여하게 됩니다.`,
  `본 프로그램은 한국씨티은행의 후원으로 운영되며, 참가자들에게 진로 멘토링과 취업 준비 역량 강화 기회를 제공합니다. 많은 관심과 신청 부탁드립니다.`,
] as const

function resolveIntroParagraphs(program: Program): string[] {
  if (program.id === GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID) {
    return [...JOB담_INTRO_PARAGRAPHS]
  }

  const description = program.description?.trim()
  if (description && !description.startsWith('유형 mock')) {
    return description.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
  }

  return DEFAULT_PROGRAM_DESCRIPTION.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
}

function resolveAdditionalHtml(program: Program): string {
  const trimmed = program.additionalContentHtml?.trim()
  if (trimmed) return trimmed
  return DEFAULT_ADDITIONAL_HTML
}

function resolveDocumentPassLabel(
  date: string | Date | undefined,
  method: string | undefined
): string {
  if (!date) return '-'
  const formatted = formatDateOnly(date)
  if (method?.trim()) return `${formatted} | ${method.trim()}`
  return formatted
}

function resolveCategoryLabel(program: Program): string {
  return program.businessArea?.trim() || '기업가 정신'
}

function resolveTitle(program: Program): string {
  const announcementTitle = program.generalCommonInfo?.announcementTitle?.trim()
  if (announcementTitle) return announcementTitle
  return program.title?.trim() || '프로그램 모집 안내'
}

function resolveFormatTag(program: Program): string {
  return (
    program.generalCommonInfo?.educationFormLabel?.trim() ||
    (program.type === 'online' ? '온라인' : program.type === 'offline' ? '오프라인' : '온라인')
  )
}

function resolveSponsorLabel(program: Program, sponsorName?: string): string {
  return (
    sponsorName?.trim() ||
    program.generalCommonInfo?.sponsorDisplayName?.trim() ||
    '-'
  )
}

export function mapProgramToParticipantRecruitmentUserView(
  program: Program,
  sponsorName?: string
): ParticipantRecruitmentUserViewModel {
  const display = resolveGeneralProgramParticipantRecruitmentDisplay(program)

  const interviewPeriodLabel = (() => {
    const interviewRange = formatDateRange(
      display.interviewStartDate,
      display.interviewEndDate
    )
    if (interviewRange !== '-') return interviewRange
    return display.recruitmentPeriodLabel
  })()

  const scheduleSpecs: RecruitmentUserSpecRow[] = [
    {
      label: '프로그램 운영기간',
      value: display.operationPeriodLabel,
      tone: 'primary',
    },
    {
      label: '1차 합격자 발표일',
      value: resolveDocumentPassLabel(
        display.documentPassAnnouncementDate,
        display.documentPassAnnouncementMethod
      ),
      tone: 'accent-red',
    },
    {
      label: '면접 기간',
      value: interviewPeriodLabel,
      tone: 'accent-blue',
    },
    {
      label: '최종 합격자 발표',
      value: display.finalAnnouncementLabel,
      tone: 'accent-blue',
    },
  ]

  const detailSpecs: RecruitmentUserSpecRow[] = [
    {
      label: '후원사',
      value: resolveSponsorLabel(program, sponsorName),
    },
    {
      label: '모집안내',
      value: program.recruitmentGuide?.trim() || DEFAULT_RECRUITMENT_GUIDE,
    },
    {
      label: '지원방법',
      value: program.applicationMethod?.trim() || DEFAULT_APPLICATION_METHOD,
    },
    {
      label: '추가 내용',
      value: resolveAdditionalHtml(program),
      isHtml: true,
    },
    {
      label: '선정',
      value: DEFAULT_SELECTION_INFO,
    },
    {
      label: '기타사항',
      value: program.otherNotes?.trim() || DEFAULT_OTHER_NOTES,
    },
    {
      label: '비고',
      value: display.notes !== '-' ? display.notes : DEFAULT_REMARKS,
    },
    {
      label: '문의처',
      value: [
        display.contactOrganizationName,
        display.contactPhone !== '-' ? `TEL ${display.contactPhone}` : null,
        display.contactEmail !== '-' ? display.contactEmail : null,
      ]
        .filter((line): line is string => Boolean(line?.trim()))
        .join('\n'),
    },
  ]

  const attachmentFileNames =
    program.attachmentFileNames?.filter(name => name.trim()) ?? DEFAULT_ATTACHMENTS

  return {
    categoryLabel: resolveCategoryLabel(program),
    title: resolveTitle(program),
    statusTag: display.recruitmentStatusLabel,
    targetTag: display.targetLabel || display.targetDetailLabel || '고등학생',
    formatTag: resolveFormatTag(program),
    introParagraphs: resolveIntroParagraphs(program),
    scheduleSpecs,
    detailSpecs,
    applicationPeriodLabel: display.recruitmentPeriodLabel,
    attachmentFileNames,
    contactLines: [
      display.contactOrganizationName,
      display.contactPhone !== '-' ? display.contactPhone : '',
      display.contactEmail !== '-' ? display.contactEmail : '',
    ].filter(Boolean),
  }
}
