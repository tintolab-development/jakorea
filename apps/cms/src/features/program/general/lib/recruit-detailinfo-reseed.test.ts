import { afterEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { seedOperationalRecruitOverlaysFromProgram } from '@/features/program/general/lib/detail-operational-save-merge'
import { collectOperationalOverlayForCatalogId } from '@/features/program/general/lib/registration-operational-form-drafts'
import { resetAllOperationalOverlayStores } from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'

afterEach(() => {
  resetAllOperationalOverlayStores()
})

function baseProgram(over: Partial<Program> = {}): Program {
  const now = '2026-01-01T00:00:00.000Z'
  return {
    id: 'reseed-1',
    title: '시드 프로그램',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    sponsorId: 's1',
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
    generalParticipantTypes: ['school_institution'],
    generalProgramAudience: 'organization',
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-06-30T00:00:00.000Z',
    rounds: [],
    createdAt: now,
    updatedAt: now,
    ...over,
  }
}

describe('recruit-detailinfo-reseed-gap', () => {
  it('Canonical 모집 설명만 있으면 catalog에 그 값을 시드한다', () => {
    const program = baseProgram({
      generalCommonInfo: {
        participantRecruitmentInfo: {
          programDescription: '저장된 설명',
          recruitmentGuide: '<p>저장된 모집 안내</p>',
        },
      },
    })
    seedOperationalRecruitOverlaysFromProgram(program)
    const school = collectOperationalOverlayForCatalogId('recruitment-participant-school') ?? {}
    expect(school['recruit.detailInfo.programDescription']).toBe('저장된 설명')
    expect(school['recruit.detailInfo.recruitmentGuide']).toBe('<p>저장된 모집 안내</p>')
  })

  it('Canonical이 없으면 Legacy overlay 모집 설명을 호환 복원한다', () => {
    const program = baseProgram({
      registrationOverlay: {
        'recruit.detailInfo.programDescription': '레거시 설명',
        'recruit.detailInfo.recruitmentGuide': '<p>레거시 안내</p>',
      },
      generalCommonInfo: { participantRecruitmentInfo: {} },
    })
    seedOperationalRecruitOverlaysFromProgram(program)
    const school = collectOperationalOverlayForCatalogId('recruitment-participant-school') ?? {}
    expect(school['recruit.detailInfo.programDescription']).toBe('레거시 설명')
    expect(school['recruit.detailInfo.recruitmentGuide']).toBe('<p>레거시 안내</p>')
  })

  it('nested와 overlay가 충돌하면 nested가 화면·PATCH 정본이다', () => {
    const program = baseProgram({
      registrationOverlay: {
        'recruit.detailInfo.programDescription': 'Legacy',
      },
      generalCommonInfo: {
        participantRecruitmentInfo: { programDescription: 'Canonical' },
      },
    })
    seedOperationalRecruitOverlaysFromProgram(program)
    const school = collectOperationalOverlayForCatalogId('recruitment-participant-school') ?? {}
    expect(school['recruit.detailInfo.programDescription']).toBe('Canonical')
  })

  it('Canonical 빈 문자열은 overlay 옛 값을 되살리지 않는다', () => {
    const program = baseProgram({
      registrationOverlay: {
        'recruit.detailInfo.programDescription': 'Legacy',
        'recruit.detailInfo.otherNotes': '기존 비고',
      },
      generalCommonInfo: {
        participantRecruitmentInfo: { programDescription: '', remarks: '' },
      },
    })
    seedOperationalRecruitOverlaysFromProgram(program)
    const school = collectOperationalOverlayForCatalogId('recruitment-participant-school') ?? {}
    expect(school['recruit.detailInfo.programDescription']).toBe('')
    expect(school['recruit.detailInfo.otherNotes']).toBe('')
  })

  it('기관·개인·강사·봉사자 catalog를 격리한다', () => {
    const program = baseProgram({
      generalParticipantTypes: [
        'school_institution',
        'individual',
        'teacher_instructor',
        'volunteer',
      ],
      registrationOverlay: {
        'recruit.detailInfo.programDescription': '기관설명',
        'recruit.individual.notes': '개인비고',
        'recruitInstructor.detailInfo.programDescription': '강사설명',
        'recruitVolunteer.detailInfo.programDescription': '봉사설명',
      },
      generalCommonInfo: {
        participantRecruitmentInfo: {},
        instructorRecruitmentInfo: {},
        volunteerRecruitmentInfo: {},
      },
    })
    seedOperationalRecruitOverlaysFromProgram(program)
    const school = collectOperationalOverlayForCatalogId('recruitment-participant-school') ?? {}
    const individual = collectOperationalOverlayForCatalogId('recruitment-participant-individual') ?? {}
    const instructor = collectOperationalOverlayForCatalogId('recruitment-instructor') ?? {}
    const volunteer = collectOperationalOverlayForCatalogId('recruitment-volunteer') ?? {}

    expect(school['recruit.detailInfo.programDescription']).toBe('기관설명')
    expect(school['recruit.individual.notes']).toBeUndefined()
    expect(school['recruitInstructor.detailInfo.programDescription']).toBeUndefined()
    expect(school['recruitVolunteer.detailInfo.programDescription']).toBeUndefined()

    expect(individual['recruit.individual.notes']).toBe('개인비고')
    expect(individual['recruitInstructor.detailInfo.programDescription']).toBeUndefined()
    expect(individual['recruitVolunteer.detailInfo.programDescription']).toBeUndefined()

    expect(instructor['recruitInstructor.detailInfo.programDescription']).toBe('강사설명')
    expect(instructor['recruit.detailInfo.programDescription']).toBeUndefined()
    expect(instructor['recruitVolunteer.detailInfo.programDescription']).toBeUndefined()

    expect(volunteer['recruitVolunteer.detailInfo.programDescription']).toBe('봉사설명')
    expect(volunteer['recruit.detailInfo.programDescription']).toBeUndefined()
    expect(volunteer['recruitInstructor.detailInfo.programDescription']).toBeUndefined()
  })

  it('선택되지 않은 봉사자 catalog를 만들지 않는다', () => {
    const program = baseProgram({
      generalParticipantTypes: ['school_institution'],
      registrationOverlay: {
        'recruit.detailInfo.programDescription': '기관설명',
        'recruitVolunteer.detailInfo.programDescription': '유령봉사',
      },
      generalCommonInfo: { participantRecruitmentInfo: {} },
    })
    seedOperationalRecruitOverlaysFromProgram(program)
    expect(collectOperationalOverlayForCatalogId('recruitment-volunteer')).toEqual({})
  })

  it('같은 GET으로 다시 시드해도 값이 유지된다', () => {
    const program = baseProgram({
      registrationOverlay: {
        'recruit.detailInfo.programDescription': '<p>저장된 모집 안내</p>',
        'recruit.detailInfo.thumbFileObjectId': 77,
        'recruit.detailInfo.thumbFileName': 'poster.png',
        'recruit.detailInfo.attachmentFileObjectIds': [101, 202],
        'recruit.detailInfo.attachmentFileNames': ['a.pdf', 'b.pdf'],
      },
      generalCommonInfo: { participantRecruitmentInfo: {} },
    })
    seedOperationalRecruitOverlaysFromProgram(program)
    const first = collectOperationalOverlayForCatalogId('recruitment-participant-school') ?? {}
    seedOperationalRecruitOverlaysFromProgram(program)
    const second = collectOperationalOverlayForCatalogId('recruitment-participant-school') ?? {}
    expect(second['recruit.detailInfo.programDescription']).toBe('<p>저장된 모집 안내</p>')
    expect(second['recruit.detailInfo.thumbFileObjectId']).toBe(77)
    expect(second['recruit.detailInfo.thumbFileName']).toBe('poster.png')
    expect(second['recruit.detailInfo.attachmentFileObjectIds']).toEqual([101, 202])
    expect(second['recruit.detailInfo.attachmentFileNames']).toEqual(['a.pdf', 'b.pdf'])
    expect(second).toEqual(first)
  })
})
