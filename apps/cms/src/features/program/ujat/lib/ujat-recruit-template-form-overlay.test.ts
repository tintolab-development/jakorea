import { afterEach, describe, expect, it } from 'vitest'
import {
  mergeUjatRecruitFormOverlayPatch,
  programToUjatRecruitTemplateFormValues,
} from '@/features/program/ujat/lib/use-ujat-recruit-template-form-overlay-sync'
import { coalesceUjatRecruitOverlay } from '@/features/program/ujat/lib/ujat-recruit-overlay-coalesce'
import {
  replaceUjatRecruitInstitutionOverlay,
  resetUjatRecruitInstitutionOverlay,
} from '@/features/template/ui/form-set/recruit-form/UJAT-institution/ujat-recruit-institution-overlay-sync'
import { programToDetailEditValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  applyUjatRecruitInstitutionOverlayOntoProgram,
  buildUjatRecruitInstitutionOverlayFromDetailEditValues,
  UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS as INSTITUTION_KEYS,
} from '@/features/program/ujat/lib/ujat-recruit-institution-template-merge'
import {
  applyUjatRecruitVolunteerOverlayOntoProgram,
  buildUjatRecruitVolunteerOverlayFromDetailEditValues,
  UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS as VOLUNTEER_KEYS,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-template-merge'
import { resolveUjatRecruitDisplayProgram } from '@/features/program/ujat/lib/ujat-recruit-display-program'
import { resolveUjatVolunteerActivityTermDisplay } from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-program-round'
import { UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM } from '@/features/program/ujat/lib/ujat-institution-recruit-template-preview-program'
import { UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM } from '@/features/program/ujat/lib/ujat-volunteer-recruit-template-preview-program'

describe('UJAT recruit form overlay', () => {
  afterEach(() => {
    resetUjatRecruitInstitutionOverlay()
  })

  it('학교 모집 문의처·공고명을 overlay에 넣고 다시 폼으로 복원한다', () => {
    const values = {
      ...programToDetailEditValues(UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM),
      announcementTitle: '참여 기관 모집 공고',
      recruitmentContactOrganizationName: 'JA Korea 문의',
      contactPhone: '02-6085-6028',
      contactEmail: 'recruit@jakorea.org',
      district: '서울 지역 초등학교',
    }
    const overlay = buildUjatRecruitInstitutionOverlayFromDetailEditValues(values)
    expect(overlay[INSTITUTION_KEYS.publicTitle]).toBe('참여 기관 모집 공고')
    expect(overlay[INSTITUTION_KEYS.contact]).toEqual({
      name: 'JA Korea 문의',
      phone: '02-6085-6028',
      email: 'recruit@jakorea.org',
    })

    const applied = applyUjatRecruitInstitutionOverlayOntoProgram(
      UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      overlay
    )
    expect(applied.generalCommonInfo?.announcementTitle).toBe('참여 기관 모집 공고')
    expect(applied.mainTitle).toBe(UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM.mainTitle)
    const restored = programToDetailEditValues(applied)
    expect(restored.announcementTitle).toBe('참여 기관 모집 공고')
    expect(restored.recruitmentContactOrganizationName).toBe('JA Korea 문의')
    expect(restored.contactPhone).toBe('02-6085-6028')
    expect(restored.district).toBe('서울 지역 초등학교')
  })

  it('봉사자 모집 문의처·활동 기수를 overlay에 넣고 다시 폼으로 복원한다', () => {
    const base = programToDetailEditValues(UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM)
    const values = {
      ...base,
      announcementTitle: '봉사자 모집 공고',
      volunteerRecruitmentContactOrganizationName: 'UJAT 운영팀',
      contactPhone: '010-1234-5678',
      contactEmail: 'volunteer@jakorea.org',
      volunteerTargetDetail: '대학생',
      rounds: (base.rounds ?? []).map((round, index) =>
        index === 0 ? { ...round, curriculum: '3' } : round
      ),
    }
    const overlay = buildUjatRecruitVolunteerOverlayFromDetailEditValues(values)
    expect(overlay[VOLUNTEER_KEYS.publicTitle]).toBe('봉사자 모집 공고')
    expect(overlay[VOLUNTEER_KEYS.activityTermH1]).toBe('3')
    expect(overlay[VOLUNTEER_KEYS.contact]).toEqual({
      name: 'UJAT 운영팀',
      phone: '010-1234-5678',
      email: 'volunteer@jakorea.org',
    })

    const applied = applyUjatRecruitVolunteerOverlayOntoProgram(
      UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      overlay
    )
    const restored = programToDetailEditValues(applied)
    expect(restored.announcementTitle).toBe('봉사자 모집 공고')
    expect(restored.volunteerRecruitmentContactOrganizationName).toBe('UJAT 운영팀')
    expect(restored.rounds?.[0]?.curriculum).toBe('3')
    expect(restored.volunteerTargetDetail).toBe('대학생')
  })

  it('탭 복귀처럼 공고명이 대표명과 같아도 overlay에서 다시 채운다', () => {
    replaceUjatRecruitInstitutionOverlay({
      [INSTITUTION_KEYS.publicTitle]: '참여 기관 모집 공고',
    })
    const aliased = {
      ...UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      mainTitle: '참여 기관 모집 공고',
      title: '참여 기관 모집 공고',
      generalCommonInfo: {
        ...UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM.generalCommonInfo,
        announcementTitle: '참여 기관 모집 공고',
      },
    }
    expect(programToDetailEditValues(aliased).announcementTitle).toBeUndefined()
    expect(programToUjatRecruitTemplateFormValues(aliased, 'institution').announcementTitle).toBe(
      '참여 기관 모집 공고'
    )
  })

  it('캐시가 비어도 live 공고명을 유지한다', () => {
    expect(
      coalesceUjatRecruitOverlay(
        { [INSTITUTION_KEYS.publicTitle]: '' },
        { [INSTITUTION_KEYS.publicTitle]: '참여 기관 모집 공고' }
      )[INSTITUTION_KEYS.publicTitle]
    ).toBe('참여 기관 모집 공고')
  })

  it('다른 필드 변경으로 빈 공고명을 overlay에 쓰지 않는다', () => {
    const existing = { [INSTITUTION_KEYS.publicTitle]: '참여 기관 모집 공고' }
    const next = {
      [INSTITUTION_KEYS.publicTitle]: '',
      [INSTITUTION_KEYS.district]: '서울 지역 초등학교',
    }
    const merged = mergeUjatRecruitFormOverlayPatch({
      existing,
      next,
      dirtyFormField: 'district',
      kind: 'institution',
    })
    expect(merged[INSTITUTION_KEYS.publicTitle]).toBe('참여 기관 모집 공고')
    expect(merged[INSTITUTION_KEYS.district]).toBe('서울 지역 초등학교')
  })

  it('사용자가 공고명을 지운 경우에만 빈 값을 허용한다', () => {
    const merged = mergeUjatRecruitFormOverlayPatch({
      existing: { [INSTITUTION_KEYS.publicTitle]: '참여 기관 모집 공고' },
      next: { [INSTITUTION_KEYS.publicTitle]: '' },
      dirtyFormField: 'announcementTitle',
      kind: 'institution',
    })
    expect(merged[INSTITUTION_KEYS.publicTitle]).toBe('')
  })

  it('프로그램 상세는 등록 overlay의 교육 대상을 view·edit 시드에 올린다', () => {
    const displayed = resolveUjatRecruitDisplayProgram(
      {
        ...UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
        targetLevels: undefined,
        targetLevel: undefined,
        district: undefined,
        ujatRegistrationOverlay: {
          [INSTITUTION_KEYS.targetLevels]: ['high'],
          [INSTITUTION_KEYS.district]: '고등학교 1~2학년',
        },
      },
      'institution'
    )
    expect(displayed.targetLevels).toEqual(['high'])
    expect(displayed.district).toBe('고등학교 1~2학년')
    const values = programToUjatRecruitTemplateFormValues(displayed, 'institution')
    expect(values.targetLevels).toEqual(['high'])
    expect(values.district).toBe('고등학교 1~2학년')
  })

  it('프로그램 상세는 등록 overlay의 활동 기수를 회차에 올린다', () => {
    const displayed = resolveUjatRecruitDisplayProgram(
      {
        ...UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
        rounds: UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM.rounds.map(round => ({
          ...round,
          curriculum: '',
        })),
        ujatRegistrationOverlay: {
          [VOLUNTEER_KEYS.activityTermH1]: '3',
          [VOLUNTEER_KEYS.activityTermH2]: '4',
        },
      },
      'volunteer'
    )
    expect(displayed.rounds[0]?.curriculum).toBe('3')
    expect(displayed.rounds[1]?.curriculum).toBe('4')
  })

  it('운영 회차가 1개여도 overlay 하반기 활동 기수를 표시한다', () => {
    const program = {
      ...UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      rounds: [UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM.rounds[0]],
      ujatRegistrationOverlay: {
        [VOLUNTEER_KEYS.activityTermH1]: '3',
        [VOLUNTEER_KEYS.activityTermH2]: '4',
      },
    }
    expect(resolveUjatVolunteerActivityTermDisplay(program, 'h1')).toBe('3')
    expect(resolveUjatVolunteerActivityTermDisplay(program, 'h2')).toBe('4')
  })
})
