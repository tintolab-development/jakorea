/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/features/program/shared/api/program-thumbnail', () => ({
  putProgramThumbnail: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/features/program/shared/api/program-attachments', () => ({
  putProgramAttachments: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/shared/lib/admin-file-upload', async importOriginal => {
  const actual = await importOriginal<typeof import('@/shared/lib/admin-file-upload')>()
  return {
    ...actual,
    parseFileObjectId: (value: unknown) => {
      const n = Number(value)
      return Number.isFinite(n) && n > 0 ? n : null
    },
  }
})

import type { Program } from '@/types/domain'
import {
  mapGeneralProgramToCreateRequest,
  mapGeneralProgramToUpdateRequest,
} from '@/features/program/general/api/adapters/general-program-adapters'
import { applyGeneralRegistrationOverlayToProgram } from '@/features/program/general/lib/registration-overlay-to-program'
import {
  buildGeneralRegistrationOverlayFromProgram,
  resyncGeneralRegistrationOverlayFromProgram,
} from '@/features/program/general/lib/registration-overlay-sync'
import {
  omitUnchangedWageFieldsFromProgramForServiceDetail,
  serializeGeneralProgramServiceDetailJson,
} from '@/features/program/general/lib/general-program-service-detail-json'
import { applyGeneralRecruitOverlayToProgram } from '@/features/program/general/lib/general-recruit-overlay-to-program'
import { collectOperationalOverlayForCatalogId } from '@/features/program/general/lib/registration-operational-form-drafts'
import { SPONSOR_CONTACT_UNSELECTED_VALUE } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import {
  patchGeneralRecruitOverlay,
  resetGeneralRecruitOverlayStoreForTests,
  setGeneralRecruitOverlayScope,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  bindRecruitDetailMediaAfterProgramCreate,
  isEphemeralThumbPreviewUrl,
  readRecruitDetailMediaFromOverlay,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'
import { putProgramAttachments } from '@/features/program/shared/api/program-attachments'
import { putProgramThumbnail } from '@/features/program/shared/api/program-thumbnail'
import { EDITOR_EXTRAS_CURRICULUM_SINGLE, EDITOR_EXTRAS_SCHEDULE_SINGLE } from './editor-extras-fixtures'
import { OVERLAY_PHASE0_KNOWN_DIFFS } from './overlay-phase0-known-diff'

function baseProgram(): Program {
  const now = '2026-01-01T00:00:00.000Z'
  return {
    id: '186234',
    sponsorId: 'sponsor-1',
    title: '기존 대표명',
    mainTitle: '기존 대표명',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
    businessArea: '경제금융',
    partnerInvolvement: true,
    generalProgramAudience: 'organization',
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'single',
    generalParticipantTypes: ['school_institution'],
    generalCommonInfo: {
      announcementTitle: '기존 공고',
      venueKind: 'inside',
      kpi: {
        finalParticipants: 40,
        instructorCount: 3,
        volunteerCount: 2,
        finalSchools: 6,
        finalClasses: 9,
      },
      wageGradeRows: [{ grade: '1급 강사비', pricing: '1시간 당 | 기본 : 100,000원' }],
      paymentItems: '교통비',
    },
    rounds: [],
    createdAt: now,
    updatedAt: now,
  }
}

function parseServiceDetail(json: string | undefined): Record<string, unknown> {
  if (!json) return {}
  return JSON.parse(json) as Record<string, unknown>
}

function overlayKeys(detail: Record<string, unknown>): string[] {
  const registration = detail.registration as { overlay?: unknown } | undefined
  const overlay =
    registration?.overlay != null && typeof registration.overlay === 'object'
      ? (registration.overlay as Record<string, unknown>)
      : {}
  return Object.keys(overlay).sort()
}

const createOverlay: Record<string, unknown> = {
  'generalRegistration.basicInfo.localProgramTitleKo': '신규 프로그램',
  'generalRegistration.basicInfo.publicProgramTitle': '공고용 신규',
  'generalRegistration.basicInfo.programTitleEn': 'New Program',
  'generalRegistration.basicInfo.localSponsorIds': ['163001'],
  'generalRegistration.basicInfo.localSponsorId': '163001',
  'generalRegistration.basicInfo.localManagerContactIds': [SPONSOR_CONTACT_UNSELECTED_VALUE],
  'generalRegistration.basicInfo.localManagerContactId': SPONSOR_CONTACT_UNSELECTED_VALUE,
  'generalRegistration.basicInfo.businessField': 'career_employment',
  'generalRegistration.basicInfo.partnerInvolvement': 'yes',
  'generalRegistration.basicInfo.operationRangeSeal': {
    start: '2026-06-01',
    end: '2026-08-31',
  },
  'generalRegistration.kpi.participantCount': 10,
  'generalRegistration.kpi.instructor': 2,
  'generalRegistration.kpi.volunteer': 1,
  'generalRegistration.wageInfo.grade1Fee': 180000,
  'generalRegistration.wageInfo.paymentItemValues': ['traffic'],
  'generalRegistration.wageInfo.paymentItemLabels': '교통비',
  'generalRegistration.educationScheduleSettings.scheduleLines': ['2026-06-10 10:00'],
}

describe('Phase 0-B known-diff 목록', () => {
  it('id가 유일하고 change 분류가 있다', () => {
    const ids = OVERLAY_PHASE0_KNOWN_DIFFS.map(item => item.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(OVERLAY_PHASE0_KNOWN_DIFFS.every(item => item.change !== undefined)).toBe(true)
  })
})

describe('1. 일반 프로그램 신규 등록 mapper', () => {
  it('apply + extras 컬럼 + create request 핵심 필드를 고정한다', () => {
    const applied = applyGeneralRegistrationOverlayToProgram(
      baseProgram(),
      createOverlay,
      EDITOR_EXTRAS_CURRICULUM_SINGLE
    )
    const snapshot: Program = {
      ...applied,
      generalProgramEducationStructure: EDITOR_EXTRAS_CURRICULUM_SINGLE.programType,
      generalProgramSessionRound: EDITOR_EXTRAS_CURRICULUM_SINGLE.sessionRoundType,
      registrationOverlay: {
        ...createOverlay,
      },
    }
    const request = mapGeneralProgramToCreateRequest(snapshot)
    const detail = parseServiceDetail(request.serviceDetailJson)

    expect(request.title).toBe('신규 프로그램')
    expect(request.sponsorId).toBe('163001')
    expect(request.businessStartDate).toBeDefined()
    expect(request.autoApplyDefaultFormBindings).toBe(true)
    expect(detail.generalProgramEducationStructure).toBe('curriculum')
    expect(detail.generalProgramSessionRound).toBe('single')
    expect((detail.generalCommonInfo as { announcementTitle?: string } | undefined)?.announcementTitle).toBe(
      '공고용 신규'
    )
    expect(overlayKeys(detail).some(key => key.startsWith('application.'))).toBe(false)
    expect(overlayKeys(detail)).toEqual(expect.arrayContaining([
      'generalRegistration.basicInfo.localProgramTitleKo',
      'generalRegistration.basicInfo.publicProgramTitle',
      'generalRegistration.educationScheduleSettings.scheduleLines',
    ]))
  })

  it('일정형 extras는 세부프로그램 id를 보내지 않는다', () => {
    const applied = applyGeneralRegistrationOverlayToProgram(
      {
        ...baseProgram(),
        detailedProgramId: '163006',
        generalProgramEducationStructure: 'schedule',
      },
      {
        ...createOverlay,
        'generalRegistration.basicInfo.detailedProgramId': '163006',
        'generalRegistration.basicInfo.detailedProgramName': '캠프',
      },
      EDITOR_EXTRAS_SCHEDULE_SINGLE
    )
    expect(applied.detailedProgramId).toBeUndefined()
    expect(applied.generalCommonInfo?.detailedProgramName).not.toBe('캠프')
    expect(applied.generalCommonInfo?.detailedProgramName).toBeTruthy()
  })
})

describe('2. 상세 공통정보 수정 mapper', () => {
  it('overlay-first apply → resync → update patch가 공고명·후원 미선택을 유지한다', () => {
    const existing = baseProgram()
    const overlay = {
      ...createOverlay,
      'generalRegistration.basicInfo.publicProgramTitle': '수정 공고',
    }
    const applied = applyGeneralRegistrationOverlayToProgram(
      existing,
      overlay,
      EDITOR_EXTRAS_CURRICULUM_SINGLE
    )
    const synced = resyncGeneralRegistrationOverlayFromProgram(applied, overlay)
    const request = mapGeneralProgramToUpdateRequest(
      existing,
      {
        title: applied.title,
        mainTitle: applied.mainTitle,
        startDate: applied.startDate,
        endDate: applied.endDate,
        generalCommonInfo: applied.generalCommonInfo,
        registrationOverlay: synced,
        generalProgramEducationStructure: 'curriculum',
        generalProgramSessionRound: 'single',
      },
      existing
    )
    const detail = parseServiceDetail(request.serviceDetailJson)
    expect(request.title).toBe('신규 프로그램')
    expect(
      (detail.generalCommonInfo as { announcementTitle?: string } | undefined)?.announcementTitle
    ).toBe('수정 공고')
    expect(synced['generalRegistration.basicInfo.localManagerContactId']).toBe(
      SPONSOR_CONTACT_UNSELECTED_VALUE
    )
  })
})

describe('3. 모집 정보 수정 overlay merge', () => {
  beforeEach(() => {
    resetGeneralRecruitOverlayStoreForTests()
  })

  it('개인 모집 catalog peek가 create/모집 persist 스냅샷에 들어간다', () => {
    setGeneralRecruitOverlayScope('recruitment-participant-individual')
    patchGeneralRecruitOverlay({
      'recruit.individual.targetLevels': ['elementary'],
      'recruit.individual.inquiryTel': '010-0000-0000',
      'recruit.detailInfo.programDescription': '모집 설명',
    })
    const program = {
      ...baseProgram(),
      generalProgramAudience: 'individual' as const,
      generalParticipantTypes: ['individual' as const],
    }
    const collected = collectOperationalOverlayForCatalogId('recruitment-participant-individual')
    expect(collected?.['recruit.individual.targetLevels']).toEqual(['elementary'])
    const applied = applyGeneralRecruitOverlayToProgram(program, collected ?? {}, { preferOverlay: true })
    expect(applied.targetLevels).toEqual(['elementary'])
  })
})

describe('4. 신청 form binding overlay', () => {
  it('4 catalog collect prefix가 APPLICATION 전용이고 프로그램 컬럼이 아니다', () => {
    expect(collectOperationalOverlayForCatalogId('application-participant-school')).not.toBeNull()
    expect(collectOperationalOverlayForCatalogId('application-participant-individual')).not.toBeNull()
    expect(collectOperationalOverlayForCatalogId('application-instructor')).not.toBeNull()
    expect(collectOperationalOverlayForCatalogId('application-volunteer')).not.toBeNull()
  })
})

describe('5. 일정형·커리큘럼형 seed', () => {
  it('커리큘럼 시드는 일정 맵을 비우고, 일정 시드는 커리큘럼 맵을 비운다', () => {
    const curriculum = buildGeneralRegistrationOverlayFromProgram({
      ...baseProgram(),
      generalProgramEducationStructure: 'curriculum',
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        curriculumSessions: [
          { sessionLabel: '1차시', title: '단원1', description: '본문', educationFormLabel: '온라인' },
        ],
      },
    } as Program)
    expect(curriculum['generalRegistration.educationCurriculum.unitNameBySession']).toMatchObject({
      1: '단원1',
    })
    expect(
      curriculum['generalRegistration.educationScheduleCurriculum.eventNameByDetail']
    ).toEqual({})

    const schedule = buildGeneralRegistrationOverlayFromProgram({
      ...baseProgram(),
      generalProgramEducationStructure: 'schedule',
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        scheduleDetails: [
          {
            scheduleLabel: '1회',
            name: '행사',
            scheduleDateLabel: '2026-06-01',
            progressTimeSummary: '10:00-12:00',
          },
        ],
      },
    } as Program)
    expect(schedule['generalRegistration.educationCurriculum.unitNameBySession']).toEqual({})
    expect(
      schedule['generalRegistration.educationScheduleCurriculum.eventNameByDetail']
    ).toMatchObject({ 1: '행사' })
  })
})

describe('6. 공고용명·후원 담당자 빈값', () => {
  it('seed는 nested 빈 공고명을 유지하고, apply 빈 문자열은 기존 공고명으로 되돌리지 않는다', () => {
    const seeded = buildGeneralRegistrationOverlayFromProgram({
      ...baseProgram(),
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        announcementTitle: '',
      },
    })
    expect(seeded['generalRegistration.basicInfo.publicProgramTitle']).toBe('')

    const applied = applyGeneralRegistrationOverlayToProgram(
      baseProgram(),
      { 'generalRegistration.basicInfo.publicProgramTitle': '' },
      EDITOR_EXTRAS_CURRICULUM_SINGLE
    )
    expect(applied.generalCommonInfo?.announcementTitle).toBe('')
  })
})

describe('7. KPI null 및 강사비 미변경', () => {
  it('시드 KPI 파견 값은 항상 null', () => {
    const overlay = buildGeneralRegistrationOverlayFromProgram(baseProgram())
    expect(overlay['generalRegistration.kpi.dispatchedSchool']).toBeNull()
    expect(overlay['generalRegistration.kpi.dispatchedClass']).toBeNull()
    expect(overlay['generalRegistration.kpi.participantCount']).toBe(40)
  })

  it('임금 미변경 프로그램은 wage overlay 키와 nested 임금 필드를 뺀다', () => {
    const program: Program = {
      ...baseProgram(),
      registrationOverlay: {
        'generalRegistration.wageInfo.grade1Fee': 100000,
        'generalRegistration.basicInfo.publicProgramTitle': '공고',
      },
    }
    const stripped = omitUnchangedWageFieldsFromProgramForServiceDetail(program, baseProgram())
    expect(stripped.generalCommonInfo?.wageGradeRows).toBeUndefined()
    expect(stripped.generalCommonInfo?.paymentItems).toBeUndefined()
    expect(stripped.registrationOverlay?.['generalRegistration.wageInfo.grade1Fee']).toBeUndefined()
    expect(stripped.registrationOverlay?.['generalRegistration.basicInfo.publicProgramTitle']).toBe(
      '공고'
    )
  })
})

describe('8. 미디어 업로드 전후', () => {
  it('blob URL은 canonical이 아니고 objectId가 PUT sink다', async () => {
    const beforeUpload = readRecruitDetailMediaFromOverlay({
      'recruit.detailInfo.thumbObjectUrl': 'blob:http://localhost/preview',
      'recruit.detailInfo.thumbContentUrl': 'blob:http://localhost/preview',
    })
    expect(isEphemeralThumbPreviewUrl(beforeUpload.thumbObjectUrl)).toBe(true)
    expect(beforeUpload.keyVisualImage).toBeUndefined()
    expect(beforeUpload.thumbFileObjectId).toBeUndefined()

    const afterUpload = readRecruitDetailMediaFromOverlay({
      'recruit.detailInfo.thumbFileObjectId': 77,
      'recruit.detailInfo.thumbContentUrl': '/api/admin/files/77/content',
      'recruit.detailInfo.thumbFileName': 'poster.png',
      'recruit.detailInfo.attachmentFileObjectIds': [101],
      'recruit.detailInfo.attachmentFileNames': ['guide.pdf'],
    })
    expect(afterUpload.thumbFileObjectId).toBe(77)
    expect(afterUpload.keyVisualImage).toBe('/api/admin/files/77/content')

    await bindRecruitDetailMediaAfterProgramCreate('186234', {
      'recruit.detailInfo.thumbFileObjectId': 77,
      'recruit.detailInfo.attachmentFileObjectIds': [101],
    })
    expect(putProgramThumbnail).toHaveBeenCalledWith(186234, 77)
    expect(putProgramAttachments).toHaveBeenCalledWith(186234, [101])
  })

  it('일반 신규 등록은 모집 행 미디어를 create recruitments[]에 싣고 후속 PUT을 쓰지 않는다', () => {
    const request = mapGeneralProgramToCreateRequest({
      ...baseProgram(),
      generalProgramAudience: 'organization',
      generalParticipantTypes: ['school_institution'],
      registrationOverlay: {
        'recruit.detailInfo.thumbFileObjectId': 42,
        'recruit.detailInfo.attachmentFileObjectIds': [8],
      },
    })
    expect(request.recruitments?.[0]).toMatchObject({
      recruitmentType: 'PARTICIPANT',
      thumbnailFileObjectId: 42,
      attachmentFileObjectIds: [8],
    })
  })
})

describe('9. serialize overlay 키 안정성', () => {
  it('serviceDetailJson은 registration.overlay에만 쓰고 루트 registrationOverlay는 쓰지 않는다', () => {
    const json = serializeGeneralProgramServiceDetailJson({
      ...baseProgram(),
      registrationOverlay: createOverlay,
    })
    const detail = parseServiceDetail(json)
    const nested =
      detail.registration != null && typeof detail.registration === 'object'
        ? (detail.registration as { overlay?: Record<string, unknown> }).overlay
        : undefined
    expect(nested).toBeDefined()
    expect(detail.registrationOverlay).toBeUndefined()
    expect(nested?.['generalRegistration.basicInfo.publicProgramTitle']).toBe('기존 공고')
  })
})
