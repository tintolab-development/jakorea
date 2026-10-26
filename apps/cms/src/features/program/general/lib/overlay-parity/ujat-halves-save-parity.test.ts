/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import type { Program } from '@/types/domain'
import type { ProgramResponse } from '@/shared/api/generated/dashboard/schemas/programResponse'
import { fromDetail, toCreateRequest, toUpdateRequest } from '@/features/program/ujat/api/adapters'

/**
 * Part4 7단계(UJAT 반기 typed-detail) parity.
 * 생성·수정 요청의 반기·기본정보 overlay 키는 typed-detail 로 가고 registration.overlay 에는 남기지 않는다.
 * typed 가 없는 기존 프로그램 조회 결과 overlay 는 그대로여야 한다.
 */

export const UJAT_HALF_OVERLAY: Record<string, unknown> = {
  'ujat.basicInfo.programManagementName': '[BOT-TEST-UJAT] parity',
  'ujat.basicInfo.surveyItems': {
    survey: true,
    volunteer_satisfaction: true,
    school_satisfaction: false,
    lecture_evaluation: true,
  },
  'ujat.basicInfo.participant.individual': false,
  'ujat.basicInfo.participant.organization': true,
  'ujat.basicInfo.participant.teacher': false,
  'ujat.basicInfo.participant.volunteer': true,
  'ujat.h1.pre.name': '상반기 사전교육(발대식)',
  'ujat.h1.pre.delivery': 'online',
  'ujat.h1.pre.textbookMode': 'ja',
  'ujat.h1.pre.multi': {
    rowIds: [0, 1],
    regionByRow: { '0': ['seoul'], '1': ['busan'] },
    dateByRow: { '0': '2027-02-24T15:00:00.000Z', '1': '2027-02-26T15:00:00.000Z' },
  },
  'ujat.h1.event.name': '상반기 학교 경제교육',
  'ujat.h1.event.range': { start: '2027-04-01T15:00:00.000Z', end: '2027-06-17T15:00:00.000Z' },
  'ujat.h1.event.delivery': 'offline',
  'ujat.h1.closing.name': '상반기 해단식',
  'ujat.h1.closing.delivery': 'online',
  'ujat.h1.closing.multi': {
    rowIds: [0],
    regionByRow: { '0': [] },
    dateByRow: { '0': '2027-07-01T15:00:00.000Z' },
  },
  'ujat.h1.eduSchedule.unavailableDates': ['2027-05-05', '2027-05-06T15:00:00.000Z'],
  'ujat.h1.eduSchedule.exclusion': {
    excludeNone: false,
    excludeSaturday: true,
    excludeSunday: true,
    excludeHoliday: true,
  },
  'ujat.h2.event.name': '하반기 학교 경제교육',
  'ujat.h2.event.range': { start: '2027-09-09T15:00:00.000Z', end: '2027-11-18T15:00:00.000Z' },
  'ujat.h2.event.delivery': 'hybrid',
  'ujat.h2.eduSchedule.unavailableDates': [],
  'ujat.h2.eduSchedule.exclusion': {
    excludeNone: true,
    excludeSaturday: false,
    excludeSunday: false,
    excludeHoliday: true,
  },
}

const DRAFT = {
  title: 'UJAT 등록',
  paragraphs: [],
  formSettings: { titleNumbering: 'number' },
} as unknown as WritingFormDraft

export const UJAT_PROGRAM: Program = {
  id: '990100',
  sponsorId: 'sponsor-1',
  title: '[BOT-TEST-UJAT] parity',
  type: 'offline',
  format: 'course',
  category: 'school',
  rounds: [],
  startDate: '2027-01-01T00:00:00.000Z',
  endDate: '2027-12-31T23:59:59.999Z',
  status: 'active',
  lifecycleStatus: 'planned',
  ujatProgressStatus: 'VOLUNTEER_RECRUITING',
  targetLevels: ['elementary'],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ujatRegistrationOverlay: UJAT_HALF_OVERLAY,
} as Program

export function parsedDetailWithoutTyped(json: string | undefined | null): unknown {
  const parsed = JSON.parse(json ?? '{}') as Record<string, unknown>
  const { ujatTypedDetail: _typed, ...rest } = parsed
  return rest
}

describe('UJAT 반기 parity (part4 step7)', () => {
  it('생성 요청 — serviceDetailJson(ujatTypedDetail 제외)과 본문', () => {
    const request = toCreateRequest(UJAT_PROGRAM, { draft: DRAFT, overlay: UJAT_HALF_OVERLAY })
    const { serviceDetailJson, ...rest } = request
    expect(parsedDetailWithoutTyped(serviceDetailJson)).toMatchSnapshot('create-detail')
    expect(rest).toMatchSnapshot('create-body')
  })

  it('수정 요청 — 반기 일정 수정 PATCH 본문', () => {
    const edited = {
      ...UJAT_HALF_OVERLAY,
      'ujat.h1.event.range': { start: '2027-04-08T15:00:00.000Z', end: '2027-06-17T15:00:00.000Z' },
      'ujat.h1.eduSchedule.unavailableDates': ['2027-05-05'],
    }
    const request = toUpdateRequest(
      UJAT_PROGRAM,
      { ujatRegistrationOverlay: edited },
      { overlay: edited }
    )
    const { serviceDetailJson, ...rest } = request
    expect(parsedDetailWithoutTyped(serviceDetailJson)).toMatchSnapshot('update-detail')
    expect(rest).toMatchSnapshot('update-body')
  })

  it('조회 — typed 없는 기존 프로그램 overlay 그대로', () => {
    const mapped = fromDetail({
      id: 990100,
      programType: 'UJAT',
      title: UJAT_PROGRAM.title,
      startDate: '2027-01-01',
      endDate: '2027-12-31',
      serviceDetailJson: JSON.stringify({
        version: 1,
        program: {},
        registration: { overlay: UJAT_HALF_OVERLAY },
      }),
    } as unknown as ProgramResponse)
    expect(mapped.ujatRegistrationOverlay).toMatchSnapshot('detail-overlay-legacy')
  })
})

describe('UJAT 반기 typed (part4 step7 신규 동작)', () => {
  function detailDto(serviceDetail: Record<string, unknown>) {
    return {
      id: 990100,
      programType: 'UJAT',
      title: UJAT_PROGRAM.title,
      startDate: '2027-01-01',
      endDate: '2027-12-31',
      serviceDetailJson: JSON.stringify(serviceDetail),
    } as unknown as ProgramResponse
  }

  it('생성 요청에 반기 계획 ujatTypedDetail 을 같이 보낸다(common 없음)', () => {
    const request = toCreateRequest(UJAT_PROGRAM, { draft: DRAFT, overlay: UJAT_HALF_OVERLAY })
    const typed = (JSON.parse(request.serviceDetailJson ?? '{}') as Record<string, unknown>)
      .ujatTypedDetail
    expect(typed).toEqual({
      schemaVersion: 1,
      halfPlans: [
        {
          semesterType: 'FIRST_HALF',
          stages: [
            {
              stage: 'PRE_EDUCATION',
              rows: [
                expect.objectContaining({
                  rowId: 'legacy-FIRST_HALF-PRE_EDUCATION',
                  educationName: '상반기 사전교육(발대식)',
                  educationMethod: 'online',
                }),
              ],
            },
            {
              stage: 'MAIN_EDUCATION',
              rows: [
                expect.objectContaining({
                  rowId: 'legacy-FIRST_HALF-MAIN_EDUCATION',
                  educationName: '상반기 학교 경제교육',
                  educationMethod: 'offline',
                  startDate: '2027-04-02',
                  endDate: '2027-06-18',
                  excludedDates: ['2027-05-05', '2027-05-07'],
                  exclusion: {
                    excludeNone: false,
                    excludeSaturday: true,
                    excludeSunday: true,
                    excludePublicHoliday: true,
                  },
                }),
              ],
            },
            {
              stage: 'POST_EDUCATION',
              rows: [
                expect.objectContaining({
                  rowId: 'legacy-FIRST_HALF-POST_EDUCATION',
                  educationName: '상반기 해단식',
                  educationMethod: 'online',
                }),
              ],
            },
          ],
        },
        {
          semesterType: 'SECOND_HALF',
          stages: [
            {
              stage: 'MAIN_EDUCATION',
              rows: [
                expect.objectContaining({
                  educationName: '하반기 학교 경제교육',
                  educationMethod: 'hybrid',
                  startDate: '2027-09-10',
                  endDate: '2027-11-19',
                  excludedDates: [],
                  exclusion: {
                    excludeNone: true,
                    excludeSaturday: false,
                    excludeSunday: false,
                    excludePublicHoliday: false,
                  },
                }),
              ],
            },
          ],
        },
      ],
    })
  })

  it('수정 요청에는 ujatTypedDetail 을 넣지 않는다(반기 PUT 으로만 저장)', () => {
    const request = toUpdateRequest(
      UJAT_PROGRAM,
      { ujatRegistrationOverlay: UJAT_HALF_OVERLAY },
      { overlay: UJAT_HALF_OVERLAY }
    )
    expect(JSON.parse(request.serviceDetailJson ?? '{}')).not.toHaveProperty('ujatTypedDetail')
  })

  it('조회 — 저장된 typed 가 overlay 와 같으면 overlay 그대로', () => {
    const typed = JSON.parse(
      toCreateRequest(UJAT_PROGRAM, { draft: DRAFT, overlay: UJAT_HALF_OVERLAY })
        .serviceDetailJson ?? '{}'
    ).ujatTypedDetail
    const legacy = fromDetail(
      detailDto({ version: 1, program: {}, registration: { overlay: UJAT_HALF_OVERLAY } })
    ).ujatRegistrationOverlay
    const typedMapped = fromDetail(
      detailDto({
        version: 1,
        program: {},
        registration: { overlay: UJAT_HALF_OVERLAY },
        ujatTypedDetail: typed,
      })
    ).ujatRegistrationOverlay
    expect(typedMapped).toEqual(legacy)
  })

  it('조회 — 저장된 typed 반기가 다르면 typed 값을 우선한다(다른 키는 유지)', () => {
    const typed = JSON.parse(
      toCreateRequest(UJAT_PROGRAM, { draft: DRAFT, overlay: UJAT_HALF_OVERLAY })
        .serviceDetailJson ?? '{}'
    ).ujatTypedDetail
    const main = typed.halfPlans[0].stages[1].rows[0]
    main.startDate = '2027-04-09'
    main.excludedDates = ['2027-05-05']
    main.educationMethod = 'hybrid'
    const overlay = fromDetail(
      detailDto({
        version: 1,
        program: {},
        registration: { overlay: UJAT_HALF_OVERLAY },
        ujatTypedDetail: typed,
      })
    ).ujatRegistrationOverlay as Record<string, unknown>
    expect(overlay['ujat.h1.event.range']).toEqual({
      start: '2027-04-08T15:00:00.000Z',
      end: '2027-06-17T15:00:00.000Z',
    })
    expect(overlay['ujat.h1.eduSchedule.unavailableDates']).toEqual(['2027-05-05'])
    expect(overlay['ujat.h1.event.delivery']).toBe('hybrid')
    expect(overlay['ujat.h1.pre.multi']).toEqual(UJAT_HALF_OVERLAY['ujat.h1.pre.multi'])
    expect(overlay['ujat.h2.event.delivery']).toBe('hybrid')
    expect(overlay['ujat.h2.eduSchedule.exclusion']).toEqual(
      UJAT_HALF_OVERLAY['ujat.h2.eduSchedule.exclusion']
    )
  })
})
