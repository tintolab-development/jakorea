/** @vitest-environment node */
import { beforeEach, describe, expect, it } from 'vitest'
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
import {
  applyOperationalOverlayForCatalogId,
  collectOperationalOverlayForCatalogId,
  resetOperationalOverlayForCatalogId,
} from '@/features/program/general/lib/registration-operational-form-drafts'
import { SPONSOR_CONTACT_UNSELECTED_VALUE } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import {
  isEphemeralThumbPreviewUrl,
  readRecruitDetailMediaFromOverlay,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'
import { resetGeneralApplicationOverlayStoreForTests } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import {
  EDITOR_EXTRAS_CURRICULUM_MULTI,
  EDITOR_EXTRAS_CURRICULUM_SINGLE,
  EDITOR_EXTRAS_SCHEDULE_SINGLE,
} from '@/features/program/general/lib/overlay-phase0/editor-extras-fixtures'
import {
  applyRecruitmentDraftsToProgram,
  buildApplicationBindingDrafts,
  buildCommonInfoDraft,
  buildMediaSidecar,
  buildProgramEditSnapshot,
  buildRecruitmentDrafts,
  seedCommonInfoOverlayFromProgram,
} from './build-program-edit-snapshot'
import {
  snapshotStripUnchangedWage,
  snapshotToCommonInfoCreateSave,
  snapshotToCommonInfoUpdateSave,
} from './map-snapshot-to-requests'
import { PHASE1B_OVERLAY_DEPENDENCIES } from './phase1b-overlay-dependencies'

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

describe('Phase 1-A Phase1-B overlay 의존성 목록', () => {
  it('독립 구현 대상 함수가 비어 있지 않다', () => {
    expect(PHASE1B_OVERLAY_DEPENDENCIES.length).toBeGreaterThan(0)
    expect(new Set(PHASE1B_OVERLAY_DEPENDENCIES.map(item => item.id)).size).toBe(
      PHASE1B_OVERLAY_DEPENDENCIES.length
    )
  })
})

describe('1. 신규 등록 shadow', () => {
  it('create request가 기존 apply+mapCreate와 같다', () => {
    const applied = applyGeneralRegistrationOverlayToProgram(
      baseProgram(),
      createOverlay,
      EDITOR_EXTRAS_CURRICULUM_SINGLE
    )
    const baselineProgram: Program = {
      ...applied,
      generalProgramEducationStructure: EDITOR_EXTRAS_CURRICULUM_SINGLE.programType,
      generalProgramSessionRound: EDITOR_EXTRAS_CURRICULUM_SINGLE.sessionRoundType,
      registrationOverlay: { ...createOverlay },
    }
    const baselineRequest = mapGeneralProgramToCreateRequest(baselineProgram)

    const snapshot = buildProgramEditSnapshot({
      baseline: baseProgram(),
      overlay: createOverlay,
      extras: EDITOR_EXTRAS_CURRICULUM_SINGLE,
      draftMetadata: { mode: 'create' },
    })
    const adapter = snapshotToCommonInfoCreateSave(snapshot)
    expect(adapter.createRequest).toEqual(baselineRequest)
    expect(adapter.registrationOverlay).toEqual(createOverlay)
  })
})

describe('2. 상세 공통정보 PATCH shadow', () => {
  it('overlay-first resync + mapUpdate가 기존 경로와 같다', () => {
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
    const withType: Program = {
      ...applied,
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'single',
    }
    const synced = resyncGeneralRegistrationOverlayFromProgram(withType, overlay)
    const baselineRequest = mapGeneralProgramToUpdateRequest(
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

    const snapshot = buildProgramEditSnapshot({
      baseline: existing,
      overlay,
      extras: EDITOR_EXTRAS_CURRICULUM_SINGLE,
      draftMetadata: { mode: 'update' },
    })
    const adapter = snapshotToCommonInfoUpdateSave(snapshot, existing)
    expect(adapter.updateRequest).toEqual(baselineRequest)
    expect(adapter.patch.registrationOverlay).toEqual(synced)
  })
})

describe('3. 모집 정보 저장 shadow', () => {
  it('catalog overlay 적용 결과가 preferOverlay apply와 같다', () => {
    const program = {
      ...baseProgram(),
      generalProgramAudience: 'individual' as const,
      generalParticipantTypes: ['individual' as const],
    }
    const overlay = {
      'recruit.individual.targetLevels': ['elementary'],
      'recruit.individual.inquiryTel': '010-0000-0000',
      'recruit.detailInfo.programDescription': '모집 설명',
    }
    const baseline = applyGeneralRecruitOverlayToProgram(program, overlay, { preferOverlay: true })
    const drafts = buildRecruitmentDrafts({
      overlaysByCatalog: {
        'recruitment-participant-individual': overlay,
      },
      catalogIds: ['recruitment-participant-individual'],
    })
    const adapter = applyRecruitmentDraftsToProgram(program, drafts)
    expect(adapter).toEqual(baseline)
    expect(drafts[0]?.overlay['recruit.individual.targetLevels']).toEqual(['elementary'])
  })
})

describe('4. 신청 4 catalog 바인딩 shadow', () => {
  beforeEach(() => {
    resetGeneralApplicationOverlayStoreForTests()
    for (const catalogId of [
      'application-participant-school',
      'application-participant-individual',
      'application-instructor',
      'application-volunteer',
    ] as const) {
      resetOperationalOverlayForCatalogId(catalogId)
    }
  })

  it('prefix pick 결과가 collectOperationalOverlayForCatalogId와 같다', () => {
    const overlays = {
      'application-participant-school': {
        'application.institution.teacherTel': '02-1',
        'application.instructor.crimeRecordConfirmed': true,
      },
      'application-participant-individual': {
        'application.individual.teamInfo.teamName': '팀A',
        'application.institution.fixedScheduleSelected': ['slot-1'],
      },
      'application-instructor': {
        'application.instructor.selectedSlotIds': ['s1'],
      },
      'application-volunteer': {
        'application.volunteer.previousProgram.programName': 'JA',
      },
    } as const

    for (const [catalogId, overlay] of Object.entries(overlays)) {
      applyOperationalOverlayForCatalogId(catalogId, overlay)
    }

    const drafts = buildApplicationBindingDrafts({ overlaysByCatalog: { ...overlays } })
    for (const draft of drafts) {
      const baseline = collectOperationalOverlayForCatalogId(draft.catalogId) ?? {}
      expect(draft.overlay).toEqual(baseline)
      expect(draft.sink).toBe('form-version-overlay')
    }
    const individual = drafts.find(d => d.catalogId === 'application-participant-individual')
    expect(individual?.overlay['application.institution.fixedScheduleSelected']).toBeUndefined()
  })
})

describe('5–6. 일정형/커리큘럼형 · 단일/복수 회차 shadow', () => {
  it('시드 overlay가 seedCommonInfoOverlayFromProgram과 같다', () => {
    const curriculumProgram = {
      ...baseProgram(),
      generalCommonInfo: {
        ...baseProgram().generalCommonInfo,
        curriculumSessions: [
          { sessionLabel: '1차시', title: '단원1', description: '본문', educationFormLabel: '온라인' },
        ],
      },
    } as Program
    expect(seedCommonInfoOverlayFromProgram(curriculumProgram)).toEqual(
      buildGeneralRegistrationOverlayFromProgram(curriculumProgram)
    )

    const scheduleProgram = {
      ...baseProgram(),
      generalProgramEducationStructure: 'schedule' as const,
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
    } as Program
    expect(seedCommonInfoOverlayFromProgram(scheduleProgram)).toEqual(
      buildGeneralRegistrationOverlayFromProgram(scheduleProgram)
    )
  })

  it('단일/복수 extras apply 결과가 builder applied와 같다', () => {
    for (const extras of [EDITOR_EXTRAS_CURRICULUM_SINGLE, EDITOR_EXTRAS_CURRICULUM_MULTI, EDITOR_EXTRAS_SCHEDULE_SINGLE]) {
      const baseline = applyGeneralRegistrationOverlayToProgram(
        baseProgram(),
        createOverlay,
        extras
      )
      const draft = buildCommonInfoDraft({
        baseline: baseProgram(),
        overlay: createOverlay,
        extras,
      })
      expect(draft.applied).toEqual(baseline)
      expect(draft.program.generalProgramEducationStructure).toBe(extras.programType)
      expect(draft.program.generalProgramSessionRound).toBe(extras.sessionRoundType)
    }
  })
})

describe('7. 임금/KPI/후원사/공고명 shadow', () => {
  it('KPI dispatched null 시드를 보존한다', () => {
    const overlay = seedCommonInfoOverlayFromProgram(baseProgram())
    expect(overlay['generalRegistration.kpi.dispatchedSchool']).toBeNull()
    expect(overlay['generalRegistration.kpi.dispatchedClass']).toBeNull()
  })

  it('임금 미변경 strip 결과가 기존 함수와 같다', () => {
    const program: Program = {
      ...baseProgram(),
      registrationOverlay: {
        'generalRegistration.wageInfo.grade1Fee': 100000,
        'generalRegistration.basicInfo.publicProgramTitle': '공고',
      },
    }
    const baseline = omitUnchangedWageFieldsFromProgramForServiceDetail(program, baseProgram())
    expect(snapshotStripUnchangedWage(program, baseProgram())).toEqual(baseline)
  })

  it('빈 공고용명 apply fallback(known-diff)을 그대로 둔다', () => {
    const baseline = applyGeneralRegistrationOverlayToProgram(
      baseProgram(),
      { 'generalRegistration.basicInfo.publicProgramTitle': '' },
      EDITOR_EXTRAS_CURRICULUM_SINGLE
    )
    const draft = buildCommonInfoDraft({
      baseline: baseProgram(),
      overlay: { 'generalRegistration.basicInfo.publicProgramTitle': '' },
      extras: EDITOR_EXTRAS_CURRICULUM_SINGLE,
    })
    expect(draft.applied.generalCommonInfo?.announcementTitle).toBe(
      baseline.generalCommonInfo?.announcementTitle
    )
    expect(draft.applied.generalCommonInfo?.announcementTitle).toBe('기존 공고')
  })

  it('serialize nested 승이 기존 serialize와 같다', () => {
    const applied = applyGeneralRegistrationOverlayToProgram(
      baseProgram(),
      createOverlay,
      EDITOR_EXTRAS_CURRICULUM_SINGLE
    )
    const baselineProgram: Program = {
      ...applied,
      generalProgramEducationStructure: EDITOR_EXTRAS_CURRICULUM_SINGLE.programType,
      generalProgramSessionRound: EDITOR_EXTRAS_CURRICULUM_SINGLE.sessionRoundType,
      registrationOverlay: createOverlay,
    }
    const snapshot = buildProgramEditSnapshot({
      baseline: baseProgram(),
      overlay: createOverlay,
      extras: EDITOR_EXTRAS_CURRICULUM_SINGLE,
    })
    expect(
      serializeGeneralProgramServiceDetailJson({
        ...snapshot.commonInfo.program,
        registrationOverlay: snapshot.commonInfo.inputOverlay,
      })
    ).toEqual(serializeGeneralProgramServiceDetailJson(baselineProgram))
  })
})

describe('8. 미디어 연결 shadow', () => {
  it('blob/objectId 해석이 readRecruitDetailMediaFromOverlay와 같다', () => {
    const blobOverlay = {
      'recruit.detailInfo.thumbObjectUrl': 'blob:http://localhost/preview',
      'recruit.detailInfo.thumbContentUrl': 'blob:http://localhost/preview',
    }
    const uploaded = {
      'recruit.detailInfo.thumbFileObjectId': 77,
      'recruit.detailInfo.thumbContentUrl': '/api/admin/files/77/content',
      'recruit.detailInfo.thumbFileName': 'poster.png',
      'recruit.detailInfo.attachmentFileObjectIds': [101],
      'recruit.detailInfo.attachmentFileNames': ['guide.pdf'],
    }
    const blobSidecar = buildMediaSidecar({ overlay: blobOverlay })
    const uploadedSidecar = buildMediaSidecar({ overlay: uploaded })
    const blobMedia = readRecruitDetailMediaFromOverlay(blobOverlay)
    const uploadedMedia = readRecruitDetailMediaFromOverlay(uploaded)

    expect(blobSidecar.state.thumbObjectUrl).toBe(blobMedia.thumbObjectUrl)
    expect(isEphemeralThumbPreviewUrl(blobSidecar.state.thumbObjectUrl)).toBe(true)
    expect(blobSidecar.state.origin).toBe('ephemeral-blob')
    expect(uploadedSidecar.state.thumbFileObjectId).toBe(uploadedMedia.thumbFileObjectId)
    expect(uploadedSidecar.state.origin).toBe('uploaded-object-id')
  })

  it('행 단위 bind 의도가 기존 PUT 인자와 같다', () => {
    const sidecar = buildMediaSidecar({
      overlay: {
        'recruit.detailInfo.thumbFileObjectId': 42,
        'recruit.detailInfo.attachmentFileObjectIds': [8],
      },
      created: {
        id: '186234',
        programRecruitments: [{ id: 9, recruitmentType: 'PARTICIPANT' }],
      },
    })
    expect(sidecar.bindCalls).toEqual([
      {
        kind: 'putProgramRecruitmentThumbnail',
        programId: 186234,
        recruitmentId: 9,
        fileObjectId: 42,
      },
      {
        kind: 'putProgramRecruitmentAttachments',
        programId: 186234,
        recruitmentId: 9,
        fileObjectIds: [8],
      },
    ])
  })

  it('행이 없으면 프로그램 단위 bind 의도를 만든다', () => {
    const sidecar = buildMediaSidecar({
      overlay: {
        'recruit.detailInfo.thumbFileObjectId': 77,
        'recruit.detailInfo.attachmentFileObjectIds': [101],
      },
      created: { id: '186234', programRecruitments: [] },
    })
    expect(sidecar.bindCalls).toEqual([
      { kind: 'putProgramThumbnail', programId: 186234, fileObjectId: 77 },
      { kind: 'putProgramAttachments', programId: 186234, fileObjectIds: [101] },
    ])
  })
})

describe('9. 임시저장 복원 shadow', () => {
  it('application overlay apply→collect 왕복이 builder pick과 같다', () => {
    const overlay = {
      'application.instructor.crimeRecordConfirmed': true,
      'application.instructor.selectedSlotIds': ['s1', 's2'],
    }
    applyOperationalOverlayForCatalogId('application-instructor', overlay)
    const collected = collectOperationalOverlayForCatalogId('application-instructor')
    const drafts = buildApplicationBindingDrafts({
      overlaysByCatalog: { 'application-instructor': overlay },
    })
    const instructor = drafts.find(d => d.catalogId === 'application-instructor')
    expect(instructor?.overlay).toEqual(collected)
  })
})
