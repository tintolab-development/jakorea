/** @vitest-environment node */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  mapGeneralProgramToCreateRequest,
  mapGeneralProgramToUpdateRequest,
} from '@/features/program/general/api/adapters/general-program-adapters'
import { applyGeneralRecruitOverlayToProgram } from '@/features/program/general/lib/general-recruit-overlay-to-program'
import { resyncGeneralRecruitOverlayFromProgram } from '@/features/program/general/lib/general-recruit-overlay-from-program'
import { serializeGeneralProgramServiceDetailJson } from '@/features/program/general/lib/general-program-service-detail-json'
import { buildProgramRecruitmentRowSaveRequest } from '@/features/program/shared/lib/persist-recruitment-row-save'
import { overlayKvToIndependentRecruitmentInput } from './overlay-kv-to-recruitment-form-values'
import {
  buildIndependentRecruitmentDraft,
  splitIndependentRecruitmentCatalogOverlays,
} from './build-independent-recruitment'
import { OVERLAY_PHASE0_KNOWN_DIFFS } from '@/features/program/general/lib/overlay-phase0/overlay-phase0-known-diff'

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
    generalCommonInfo: { announcementTitle: '기존 공고', venueKind: 'inside' },
    rounds: [],
    createdAt: now,
    updatedAt: now,
  }
}

function independentFromOverlay(
  overlay: Record<string, unknown>,
  baseline: Program,
  mode: 'create' | 'update'
) {
  const adapted = overlayKvToIndependentRecruitmentInput(overlay)
  return buildIndependentRecruitmentDraft({
    formValues: adapted.formValues,
    sidecars: { ...adapted.sidecars, preferOverlay: true },
    baseline,
    mode,
  })
}

const schoolOverlay: Record<string, unknown> = {
  'recruit.maxAssignableInstructors': 3,
  'recruit.maxClassCount': 4,
  'recruit.maxScheduleCount': 2,
  'recruit.maxSessionsPerDay': 1,
  'recruit.announcementPublished': 'published',
  'recruit.recruitRangeSeal': { start: '2026-05-01', end: '2026-05-31' },
  'recruit.programRangeSeal': { start: '2026-06-01', end: '2026-08-31' },
  'recruit.targetLevels': ['elementary', 'middle'],
  'recruit.inquiryTel': '02-111-1111',
  'recruit.inquiryEmail': 'org@example.com',
  'recruit.detailInfo.programDescription': '<p>기관 설명</p>',
  'recruit.detailInfo.additionalContentHtml': '<p>기관 리치텍스트</p>',
}

const individualOverlay: Record<string, unknown> = {
  'recruit.individual.targetLevels': ['high'],
  'recruit.individual.inquiryTel': '010-0000-0000',
  'recruit.individual.recruitRangeSeal': { start: '2026-05-10', end: '2026-05-20' },
  'recruit.detailInfo.programDescription': '개인 모집 설명',
}

const instructorOverlay: Record<string, unknown> = {
  'recruit.instructor.recruitTargets': ['teacher'],
  'recruit.instructor.inquiryTel': '010-2222-2222',
  'recruit.instructor.recruitRangeSeal': { start: '2026-04-01', end: '2026-04-15' },
  'recruit.instructor.notes': '강사 비고',
  'recruitInstructor.detailInfo.programDescription': '강사 설명',
  'recruitInstructor.detailInfo.otherNotes': '강사 기타',
}

const volunteerOverlay: Record<string, unknown> = {
  'recruit.volunteer.volunteerTargets': ['university'],
  'recruit.volunteer.interviewRequired': 'yes',
  'recruit.volunteer.inquiryTel': '010-3333-3333',
  'recruit.volunteer.recruitRangeSeal': { start: '2026-04-20', end: '2026-04-30' },
  'recruit.volunteer.interviewRangeSeal': { start: '2026-05-05', end: '2026-05-06' },
  'recruit.volunteer.interview.selectedSlotKeys': ['1714892400000-1714894200000'],
  'recruitVolunteer.detailInfo.programDescription': '봉사자 설명',
}

describe('Phase 1-B recruitment import guard', () => {
  it('Independent Builder가 apply/store/RHF를 호출하지 않는다', () => {
    const dir = path.dirname(new URL(import.meta.url).pathname)
    const files = ['build-independent-recruitment.ts', 'recruitment-domain.ts', 'recruitment-form-values.ts']
    const forbidden = [
      /(?:import|from).*applyGeneralRecruitOverlayToProgram/,
      /buildMergedRegistrationOverlayForRecruitSave/,
      /collectOperationalOverlayForCatalogId/,
      /getGeneralRecruitOverlayRecord/,
      /getApplicantRecruitInstitutionOverlayRecord/,
      /from ['"]react['"]/,
      /from ['"]react-hook-form['"]/,
    ]
    for (const file of files) {
      const source = readFileSync(path.join(dir, file), 'utf8')
      for (const token of forbidden) {
        expect(token.test(source), `${file} matches ${token}`).toBe(false)
      }
    }
  })

  it('known-diff를 수정하지 않는다', () => {
    expect(OVERLAY_PHASE0_KNOWN_DIFFS.some(item => item.id === 'recruit-save-locks-announcement-title')).toBe(
      true
    )
    expect(OVERLAY_PHASE0_KNOWN_DIFFS.some(item => item.id === 'recruit-detailinfo-reseed-gap')).toBe(true)
  })
})

describe('1. 참여기관 모집 create shadow', () => {
  it('Program draft·create body가 preferOverlay apply와 같다', () => {
    const program = baseProgram()
    const legacy = applyGeneralRecruitOverlayToProgram(program, schoolOverlay, { preferOverlay: true })
    const independent = independentFromOverlay(schoolOverlay, program, 'create')
    expect(independent.programDraft).toEqual(legacy)
    expect(independent.programDraft.generalCommonInfo?.participantRecruitmentInfo?.maxClassCount).toBe(4)
    const legacyRequest = mapGeneralProgramToCreateRequest({
      ...legacy,
      registrationOverlay: schoolOverlay,
    })
    const independentRequest = mapGeneralProgramToCreateRequest({
      ...independent.programDraft,
      registrationOverlay: independent.persistOverlay,
    })
    expect(independentRequest).toEqual(legacyRequest)
    expect(independent.catalogOverlays['recruitment-participant-school']?.['recruit.maxClassCount']).toBe(4)
  })
})

describe('2. 개인 참여자 모집 create shadow', () => {
  it('targetLevels와 상세 HTML이 apply와 같다', () => {
    const program = {
      ...baseProgram(),
      generalProgramAudience: 'individual' as const,
      generalParticipantTypes: ['individual' as const],
    }
    const legacy = applyGeneralRecruitOverlayToProgram(program, individualOverlay, { preferOverlay: true })
    const independent = independentFromOverlay(individualOverlay, program, 'create')
    expect(independent.programDraft).toEqual(legacy)
    expect(independent.programDraft.targetLevels).toEqual(['high'])
  })
})

describe('3. 강사 모집 create shadow', () => {
  it('강사 설정·리치텍스트가 apply와 같다', () => {
    const program = {
      ...baseProgram(),
      generalParticipantTypes: ['school_institution', 'teacher_instructor'] as Program['generalParticipantTypes'],
    }
    const legacy = applyGeneralRecruitOverlayToProgram(program, instructorOverlay, { preferOverlay: true })
    const independent = independentFromOverlay(instructorOverlay, program, 'create')
    expect(independent.programDraft).toEqual(legacy)
    expect(independent.programDraft.generalCommonInfo?.instructorRecruitmentInfo?.otherMatters).toBe('강사 기타')
  })
})

describe('4. 봉사자 모집 create shadow', () => {
  it('면접 슬롯·exception이 apply와 같다', () => {
    const program = {
      ...baseProgram(),
      generalParticipantTypes: ['school_institution', 'volunteer'] as Program['generalParticipantTypes'],
    }
    const legacy = applyGeneralRecruitOverlayToProgram(program, volunteerOverlay, { preferOverlay: true })
    const independent = independentFromOverlay(volunteerOverlay, program, 'create')
    expect(independent.programDraft).toEqual(legacy)
    expect(independent.programDraft.generalCommonInfo?.volunteerInterviewScheduleInfo?.availableTimeSlots).toEqual(
      legacy.generalCommonInfo?.volunteerInterviewScheduleInfo?.availableTimeSlots
    )
  })
})

describe('5. 4 catalog 분리와 병합', () => {
  it('catalog overlay가 prefix+기관 한도를 유지한다', () => {
    const merged = { ...schoolOverlay, ...individualOverlay, ...instructorOverlay, ...volunteerOverlay }
    const catalogs = splitIndependentRecruitmentCatalogOverlays(merged)
    expect(catalogs['recruitment-participant-school']['recruit.maxClassCount']).toBe(4)
    expect(catalogs['recruitment-participant-individual']['recruit.individual.targetLevels']).toEqual(['high'])
    expect(catalogs['recruitment-instructor']['recruit.instructor.recruitTargets']).toEqual(['teacher'])
    expect(catalogs['recruitment-volunteer']['recruit.volunteer.interviewRequired']).toBe('yes')
  })
})

describe('6. 상세 모집 수정 PATCH shadow', () => {
  it('행이 있으면 기간 seal을 덮지 않고 row PATCH가 같다', () => {
    const existing: Program = {
      ...baseProgram(),
      applicationStartDate: '2026-01-10T00:00:00.000Z',
      applicationEndDate: '2026-01-20T00:00:00.000Z',
      programRecruitments: [
        {
          id: 9001,
          recruitmentType: 'PARTICIPANT',
          applicationType: 'ORGANIZATION',
          startAt: '2026-01-10T00:00:00.000Z',
          endAt: '2026-01-20T00:00:00.000Z',
          announcementTitle: '기존 공고',
        },
      ],
    }
    const overlay = {
      ...schoolOverlay,
      'recruit.detailInfo.programDescription': '<p>수정 설명</p>',
    }
    const legacy = applyGeneralRecruitOverlayToProgram(existing, overlay, { preferOverlay: true })
    const independent = independentFromOverlay(overlay, existing, 'update')
    expect(independent.programDraft).toEqual(legacy)
    expect(independent.programDraft.applicationStartDate).toBe(existing.applicationStartDate)

    const patch: Partial<Program> = {
      generalCommonInfo: independent.programDraft.generalCommonInfo,
      registrationOverlay: overlay,
    }
    const legacyRow = buildProgramRecruitmentRowSaveRequest({
      baseline: existing,
      draft: legacy,
      patch: { generalCommonInfo: legacy.generalCommonInfo, registrationOverlay: overlay },
      audience: 'participant',
    })
    const independentRow = buildProgramRecruitmentRowSaveRequest({
      baseline: existing,
      draft: independent.programDraft,
      patch,
      audience: 'participant',
    })
    expect(independentRow).toEqual(legacyRow)

    const legacyUpdate = mapGeneralProgramToUpdateRequest(
      existing,
      {
        generalCommonInfo: legacy.generalCommonInfo,
        registrationOverlay: resyncGeneralRecruitOverlayFromProgram(legacy, overlay),
      },
      existing
    )
    const independentUpdate = mapGeneralProgramToUpdateRequest(
      existing,
      {
        generalCommonInfo: independent.programDraft.generalCommonInfo,
        registrationOverlay: resyncGeneralRecruitOverlayFromProgram(independent.programDraft, overlay),
      },
      existing
    )
    expect(independentUpdate).toEqual(legacyUpdate)
    expect(Object.keys(independentUpdate).includes('title')).toBe(false)
  })
})

describe('7. 미디어 sidecar 통과', () => {
  it('fileObjectId는 유지하고 blob URL은 Program 이미지로 쓰지 않는다', () => {
    const overlay = {
      'recruit.detailInfo.thumbFileObjectId': 77,
      'recruit.detailInfo.thumbContentUrl': '/api/admin/files/77/content',
      'recruit.detailInfo.thumbFileName': 'poster.png',
      'recruit.detailInfo.attachmentFileObjectIds': [101],
      'recruit.detailInfo.attachmentFileNames': ['guide.pdf'],
    }
    const blobOverlay = {
      'recruit.detailInfo.thumbObjectUrl': 'blob:http://localhost/preview',
      'recruit.detailInfo.thumbContentUrl': 'blob:http://localhost/preview',
    }
    const uploaded = independentFromOverlay(overlay, baseProgram(), 'create')
    const blob = independentFromOverlay(blobOverlay, baseProgram(), 'create')
    const legacyUploaded = applyGeneralRecruitOverlayToProgram(baseProgram(), overlay, {
      preferOverlay: true,
    })
    const legacyBlob = applyGeneralRecruitOverlayToProgram(baseProgram(), blobOverlay, {
      preferOverlay: true,
    })
    expect(uploaded.programDraft).toEqual(legacyUploaded)
    expect(blob.programDraft).toEqual(legacyBlob)
    expect(String(uploaded.programDraft.keyVisualImage ?? '')).not.toMatch(/^blob:/)
    expect(String(blob.programDraft.keyVisualImage ?? '')).not.toMatch(/^blob:/)
  })
})

describe('8. serviceDetailJson · 공고명 잠금 경계', () => {
  it('create serviceDetailJson이 legacy와 같다', () => {
    const overlay = { ...schoolOverlay, ...individualOverlay }
    const legacy = applyGeneralRecruitOverlayToProgram(baseProgram(), overlay, { preferOverlay: true })
    const independent = independentFromOverlay(overlay, baseProgram(), 'create')
    expect(
      serializeGeneralProgramServiceDetailJson({ ...independent.programDraft, registrationOverlay: overlay })
    ).toEqual(serializeGeneralProgramServiceDetailJson({ ...legacy, registrationOverlay: overlay }))
    expect(independent.programDraft.generalCommonInfo?.announcementTitle).toBe('기존 공고')
  })
})
