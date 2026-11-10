/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { mapGeneralProgramToUpdateRequest } from '@/features/program/general/api/adapters/general-program-adapters'
import {
  buildProgramSponsorAssignmentsReplaceWire,
  programToGeneralCommonInfoEditValues,
} from '@/features/program/general/model/common-info-edit-schema'
import { PRE_EDUCATION_SCHEDULE_LABEL } from '@/features/program/general/lib/schedule-detail-form'
import { SPONSOR_CONTACT_UNSELECTED_VALUE } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import { mergeProgramSponsorAssignments } from '@/features/program/shared/lib/merge-program-sponsor-assignments'
import { preserveCurriculumSessionNos } from './independent-session-authoring'
import { createGeneralProgramCommonInfoIndependentSave } from './common-info-independent-save'
import {
  GENERAL_DETAIL_DATA_INTEGRITY_CONTRACT_STATUS,
  GENERAL_DETAIL_DATA_INTEGRITY_STATUS,
} from './general-detail-rhf-save-path'

const UNIT_NAME_KEY = 'generalRegistration.educationCurriculum.unitNameBySession'
const UNIT_CONTENT_KEY = 'generalRegistration.educationCurriculum.unitContentBySession'
const PROGRESS_KEY = 'generalRegistration.educationCurriculum.progressSessionByRound'
const ROUND_CONTENT_KEY = 'generalRegistration.educationCurriculum.roundContentByRound'
const ASSIGNMENT_KEY = 'generalRegistration.educationCurriculum.assignmentByRound'

const GET_WAGE_ROWS = [
  { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 140,000원' },
  { grade: '2급 강사비', pricing: '1시간 당 | 기본 : 120,000원' },
  { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 100,000원' },
] as const

function organizationProgram186307(): Program {
  const now = '2026-10-21T00:00:00.000Z'
  return {
    id: '186307',
    sponsorId: '1627251',
    managerName: '담당자A',
    title: '일반기관공통정보',
    mainTitle: '일반기관공통정보',
    titleEn: 'Org Program',
    detailedProgramId: 'dp-1',
    educationProcess: 'Traditional (Paper)',
    ipOwned: 'JA',
    courseDeliveredBy: 'JA',
    ips: 'Prepare',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
    businessArea: '경제금융',
    partnerInvolvement: false,
    generalProgramAudience: 'organization',
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'multi',
    generalParticipantTypes: ['school_institution'],
    generalCommonInfo: {
      announcementTitle: '기존 공고',
      detailedProgramName: '기존 세부프로그램',
      venueKind: 'inside',
      venueDetail: '서울시 강남구',
      sponsorManagementIds: ['1627251', '163301'],
      sponsorManagerContactIds: [
        '1627251::1627253',
        '1627251::1627254',
        '163301::163322',
        '163301::163323',
      ],
      sponsorManagerContactNames: {
        '1627251::1627253': '담당자A',
        '1627251::1627254': '담당자A2',
        '163301::163322': '담당자B',
        '163301::163323': '담당자B2',
      },
      educationScheduleLines: ['26년 4월 1일(수) 10:00 ~ 12:00'],
      educationFormLabel: '오프라인',
      participationMethod: 'team',
      curriculumSessions: [
        { sessionNo: 1, sessionLabel: '1차시', title: '단원1', description: '본문1' },
        { sessionNo: 2, sessionLabel: '2차시', title: '단원2', description: '본문2' },
      ],
      scheduleDetails: [],
      wageGradeRows: [...GET_WAGE_ROWS],
      paymentItems: '교통비, 식사비',
      deductionItems: '원천징수세액',
      kpi: {
        finalParticipants: 80,
        instructorCount: 2,
        volunteerCount: 1,
        finalSchools: 4,
        finalClasses: 8,
      },
      participantRecruitmentInfo: { remarks: '모집 비고 유지' },
    },
    registrationOverlay: {
      [UNIT_NAME_KEY]: { 1: '단원1', 2: '단원2' },
      [UNIT_CONTENT_KEY]: { 1: '본문1', 2: '본문2' },
      [PROGRESS_KEY]: { 1: '단원1', 2: '단원2' },
      [ROUND_CONTENT_KEY]: { 1: '본문1', 2: '본문2' },
      [ASSIGNMENT_KEY]: { 1: { enabled: false, period: '' }, 2: { enabled: false, period: '' } },
    },
    rounds: [],
    createdAt: now,
    updatedAt: now,
  }
}

function parseJson(json: string | undefined): {
  generalCommonInfo?: Record<string, unknown>
  registrationOverlay?: Record<string, unknown>
  registration?: { overlay?: Record<string, unknown> }
} {
  if (!json) return {}
  return JSON.parse(json) as ReturnType<typeof parseJson>
}

function overlayMaps(parsed: ReturnType<typeof parseJson>) {
  const overlay = parsed.registrationOverlay ?? parsed.registration?.overlay ?? {}
  const nested = parsed.registration?.overlay ?? {}
  return { overlay, nested }
}

function mapKeys(map: unknown): number[] {
  const record = (map ?? {}) as Record<string, unknown>
  return Object.keys(record)
    .filter(key => record[key] != null)
    .map(Number)
    .filter(n => Number.isInteger(n) && n > 0)
    .sort((a, b) => a - b)
}

function saveBody(
  existing: Program,
  values: ReturnType<typeof programToGeneralCommonInfoEditValues>,
  changedFormKeys: ReadonlySet<string>
) {
  const save = createGeneralProgramCommonInfoIndependentSave({
    values,
    program: existing,
    changedFormKeys,
  })
  const body = mapGeneralProgramToUpdateRequest(
    save.programDraft,
    save.patch,
    existing,
    save.serializeOptions
  )
  return { save, body, parsed: parseJson(body.serviceDetailJson) }
}

describe('GENERAL_DETAIL_DATA_INTEGRITY', () => {
  it('판정 상수는 FE_READY 와 CONTRACT_READY 이다', () => {
    expect(GENERAL_DETAIL_DATA_INTEGRITY_STATUS).toBe('GENERAL_DETAIL_DATA_INTEGRITY_FE_READY')
    expect(GENERAL_DETAIL_DATA_INTEGRITY_CONTRACT_STATUS).toBe(
      'GENERAL_DETAIL_DATA_INTEGRITY_CONTRACT_READY'
    )
  })

  it('1. 후원사 2개 + 담당자 2개에서 제목만 수정하면 sponsors를 omit한다', () => {
    const existing = organizationProgram186307()
    const values = programToGeneralCommonInfoEditValues(existing)
    const { save, body } = saveBody(
      existing,
      { ...values, announcementTitle: '제목만 수정', mainTitle: '제목만 수정' },
      new Set(['announcementTitle', 'mainTitle'])
    )
    expect(save.patch.generalCommonInfo).not.toHaveProperty('sponsorManagementIds')
    expect(save.patch.generalCommonInfo).not.toHaveProperty('sponsorManagerContactIds')
    expect(save.patch).not.toHaveProperty('sponsorId')
    expect(body).not.toHaveProperty('sponsors')
    expect(body).not.toHaveProperty('sponsorId')
  })

  it('2. 후원사·담당자 미변경이면 dirty여도 PATCH에서 omit한다', () => {
    const existing = organizationProgram186307()
    const values = programToGeneralCommonInfoEditValues(existing)
    const { body } = saveBody(
      existing,
      { ...values, announcementTitle: '공고 수정' },
      new Set(['announcementTitle', 'sponsorManagementIds', 'sponsorManagerContactIds'])
    )
    expect(body).not.toHaveProperty('sponsors')
    expect(body).not.toHaveProperty('sponsorId')
  })

  it('3. 후원사 2개 상태에서 교육 일정만 수정해도 sponsors를 omit한다', () => {
    const existing = organizationProgram186307()
    const values = programToGeneralCommonInfoEditValues(existing)
    const { body, parsed } = saveBody(
      existing,
      {
        ...values,
        educationScheduleLines: ['26년 5월 1일(금) 10:00 ~ 12:00'],
      },
      new Set(['educationScheduleLines'])
    )
    expect(body).not.toHaveProperty('sponsors')
    expect(parsed.generalCommonInfo).not.toHaveProperty('sponsorManagementIds')
    expect(parsed.generalCommonInfo).not.toHaveProperty('wageGradeRows')
    expect(parsed.generalCommonInfo).not.toHaveProperty('kpi')
  })

  it('4. 카탈로그가 비어 있어도 GET 선택값 2개를 자동 삭제하지 않는다', () => {
    const existing = organizationProgram186307()
    const values = programToGeneralCommonInfoEditValues(existing, {
      sponsors: [],
      contactsBySponsorId: {},
    })
    expect(values.sponsorManagementIds).toEqual(['1627251', '163301'])
    expect(values.sponsorManagerContactIds).toEqual([
      '1627251::1627253',
      '1627251::1627254',
      '163301::163322',
      '163301::163323',
    ])
    const { body } = saveBody(
      existing,
      { ...values, announcementTitle: '카탈로그 공백' },
      new Set(['announcementTitle'])
    )
    expect(body).not.toHaveProperty('sponsors')
  })

  it('5. 후원사를 실제로 2개→1개 바꾸면 남은 후원사·담당자를 모두 보낸다', () => {
    const existing = organizationProgram186307()
    const values = programToGeneralCommonInfoEditValues(existing)
    const { body } = saveBody(
      existing,
      {
        ...values,
        sponsorManagementIds: ['1627251'],
        sponsorManagerContactIds: ['1627251::1627253', '1627251::1627254'],
        sponsorManagerContactId: '1627251::1627253',
      },
      new Set(['sponsorManagementIds', 'sponsorManagerContactIds', 'sponsorManagerContactId'])
    )
    expect(body.sponsors).toEqual([
      { sponsorId: '1627251', sponsorContactIds: ['1627253', '1627254'] },
    ])
    expect(body).not.toHaveProperty('sponsorId')
  })

  it('같은 후원사 담당자 2명 중 1명을 지우면 나머지 1명과 다른 후원사 담당자를 유지한다', () => {
    const existing = organizationProgram186307()
    const values = programToGeneralCommonInfoEditValues(existing)
    const { body } = saveBody(
      existing,
      {
        ...values,
        sponsorManagerContactIds: ['1627251::1627253', '163301::163322', '163301::163323'],
        sponsorManagerContactId: '1627251::1627253',
      },
      new Set(['sponsorManagerContactIds', 'sponsorManagerContactId'])
    )
    expect(body.sponsors).toEqual([
      { sponsorId: '1627251', sponsorContactIds: ['1627253'] },
      { sponsorId: '163301', sponsorContactIds: ['163322', '163323'] },
    ])
  })

  it('6. 담당자만 실제로 수정하면 후원사 2개를 유지한 채 새 담당자를 보낸다', () => {
    const existing = organizationProgram186307()
    const values = programToGeneralCommonInfoEditValues(existing)
    const { body } = saveBody(
      existing,
      {
        ...values,
        sponsorManagerContactIds: ['1627251::1627253', '1627251::1627254', '163301::999999'],
        sponsorManagerContactId: '1627251::1627253',
      },
      new Set(['sponsorManagerContactIds', 'sponsorManagerContactId'])
    )
    expect(body.sponsors).toEqual([
      { sponsorId: '1627251', sponsorContactIds: ['1627253', '1627254'] },
      { sponsorId: '163301', sponsorContactIds: ['999999'] },
    ])
  })

  it('7. 담당자 명시 해제는 sponsorContactIds [] 를 보낸다', () => {
    const existing = organizationProgram186307()
    const values = programToGeneralCommonInfoEditValues(existing)
    const { body } = saveBody(
      existing,
      {
        ...values,
        sponsorManagerContactIds: [SPONSOR_CONTACT_UNSELECTED_VALUE],
        sponsorManagerContactId: SPONSOR_CONTACT_UNSELECTED_VALUE,
      },
      new Set(['sponsorManagerContactIds', 'sponsorManagerContactId'])
    )
    expect(body.sponsors).toEqual([
      { sponsorId: '1627251', sponsorContactIds: [] },
      { sponsorId: '163301', sponsorContactIds: [] },
    ])
  })

  it('8. 사전교육 ON + 일반 1차시는 일반 회차 sessionNo를 1로 유지한다', () => {
    const existing = organizationProgram186307()
    existing.generalCommonInfo = {
      ...existing.generalCommonInfo,
      scheduleCurriculumPreEducation: true,
      curriculumSessions: [
        {
          sessionLabel: PRE_EDUCATION_SCHEDULE_LABEL,
          title: PRE_EDUCATION_SCHEDULE_LABEL,
          description: '사전 내용',
        },
        { sessionNo: 1, sessionLabel: '1차시', title: '단원1', description: '본문1' },
      ],
    }
    const preserved = preserveCurriculumSessionNos(
      [
        {
          sessionLabel: PRE_EDUCATION_SCHEDULE_LABEL,
          title: PRE_EDUCATION_SCHEDULE_LABEL,
          description: '사전 내용',
        },
        { sessionLabel: '1차시', title: '단원1', description: '본문1' },
      ],
      existing.generalCommonInfo.curriculumSessions
    )
    expect(preserved?.find(row => row.sessionLabel === '1차시')?.sessionNo).toBe(1)
    expect(preserved?.find(row => row.sessionLabel === '1차시')?.sessionNo).not.toBe(2)
  })

  it('9·10. 일반 2차시 삭제 후 Overlay 맵에서 2차시 키를 제거한다', () => {
    const existing = organizationProgram186307()
    const values = programToGeneralCommonInfoEditValues(existing)
    const { parsed } = saveBody(
      existing,
      { ...values, curriculumSessions: values.curriculumSessions.slice(0, 1) },
      new Set(['curriculumSessions'])
    )
    const sessions = parsed.generalCommonInfo?.curriculumSessions as Array<{
      sessionNo?: number
      sessionLabel?: string
    }>
    expect(sessions).toHaveLength(1)
    expect(sessions[0]?.sessionNo).toBe(1)
    const { overlay, nested } = overlayMaps(parsed)
    for (const source of [overlay, nested]) {
      expect(mapKeys(source[UNIT_NAME_KEY])).toEqual([1])
      expect((source[UNIT_NAME_KEY] as Record<string, unknown>)['2']).toBeNull()
      expect(mapKeys(source[UNIT_CONTENT_KEY])).toEqual([1])
      expect(mapKeys(source[PROGRESS_KEY])).toEqual([1])
      expect(mapKeys(source[ROUND_CONTENT_KEY])).toEqual([1])
      expect(mapKeys(source[ASSIGNMENT_KEY])).toEqual([1])
    }
  })

  it('11. 저장 후 GET 병합 → RHF 재진입 시 2차시가 다시 생기지 않는다', () => {
    const existing = organizationProgram186307()
    const values = programToGeneralCommonInfoEditValues(existing)
    const { parsed } = saveBody(
      existing,
      { ...values, curriculumSessions: values.curriculumSessions.slice(0, 1) },
      new Set(['curriculumSessions'])
    )
    const merged: Program = {
      ...existing,
      generalCommonInfo: {
        ...existing.generalCommonInfo,
        ...(parsed.generalCommonInfo as Program['generalCommonInfo']),
      },
      registrationOverlay: {
        ...(existing.registrationOverlay ?? {}),
        ...(parsed.registrationOverlay ?? parsed.registration?.overlay ?? {}),
      },
    }
    const reseed = programToGeneralCommonInfoEditValues(merged)
    expect(reseed.curriculumSessions).toHaveLength(1)
    expect(reseed.curriculumSessions.map(row => row.sessionLabel)).not.toContain('2차시')
  })

  it('12. sparse sessionNo [1,3] 를 1부터 다시 부여하지 않는다', () => {
    const existing = organizationProgram186307()
    existing.generalCommonInfo = {
      ...existing.generalCommonInfo,
      curriculumSessions: [
        { sessionNo: 1, sessionLabel: '1차시', title: '단원1', description: '본문1' },
        { sessionNo: 3, sessionLabel: '3차시', title: '단원3', description: '본문3' },
      ],
    }
    const values = programToGeneralCommonInfoEditValues(existing)
    const { parsed } = saveBody(
      existing,
      {
        ...values,
        curriculumSessions: values.curriculumSessions.map((row, index) =>
          index === 1 ? { ...row, title: '단원3 수정' } : row
        ),
      },
      new Set(['curriculumSessions'])
    )
    const nos = (parsed.generalCommonInfo?.curriculumSessions as Array<{ sessionNo?: number }>).map(
      row => row.sessionNo
    )
    expect(nos).toEqual([1, 3])
  })

  it('adapter가 생략된 담당자 키를 existing에서 복원해 미변경 sponsors를 omit한다', () => {
    const existing = organizationProgram186307()
    const body = mapGeneralProgramToUpdateRequest(
      existing,
      {
        generalCommonInfo: {
          announcementTitle: '제목만',
          sponsorManagementIds: ['1627251'],
        },
      },
      existing
    )
    expect(body).not.toHaveProperty('sponsors')
  })

  it('GET sponsorContacts[] 를 RHF 담당자 목록으로 모두 보존한다', () => {
    const existing = organizationProgram186307()
    const merged = mergeProgramSponsorAssignments(existing, [
      {
        sponsorId: '1627251',
        sponsorName: '후원사A',
        sponsorContacts: [
          { sponsorContactId: '1627253', sponsorContactName: '담당자A' },
          { sponsorContactId: '1627254', sponsorContactName: '담당자A2' },
        ],
      },
      {
        sponsorId: '163301',
        sponsorName: '후원사B',
        sponsorContacts: [
          { sponsorContactId: '163322', sponsorContactName: '담당자B' },
          { sponsorContactId: '163323', sponsorContactName: '담당자B2' },
        ],
      },
    ])
    const values = programToGeneralCommonInfoEditValues(merged)
    expect(values.sponsorManagementIds).toEqual(['1627251', '163301'])
    expect(values.sponsorManagerContactIds).toEqual([
      '1627251::1627253',
      '1627251::1627254',
      '163301::163322',
      '163301::163323',
    ])
  })

  it('ReplaceWire 는 후원사당 sponsorContactIds 전체를 묶고 단수 행으로 쪼개지 않는다', () => {
    expect(
      buildProgramSponsorAssignmentsReplaceWire(
        ['1627251', '163301'],
        ['1627251::1627253', '1627251::1627254', '163301::163322']
      )
    ).toEqual([
      { sponsorId: '1627251', sponsorContactIds: ['1627253', '1627254'] },
      { sponsorId: '163301', sponsorContactIds: ['163322'] },
    ])
  })

  it('미변경 강사비·지급 항목은 PATCH JSON에 다시 실리지 않는다', () => {
    const existing = organizationProgram186307()
    const values = programToGeneralCommonInfoEditValues(existing)
    const { body, parsed } = saveBody(
      existing,
      { ...values, announcementTitle: '제목만' },
      new Set(['announcementTitle'])
    )
    expect(body).not.toHaveProperty('wagePolicies')
    expect(parsed.generalCommonInfo).not.toHaveProperty('wageGradeRows')
    expect(parsed.generalCommonInfo).not.toHaveProperty('paymentItems')
  })
})
