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
import {
  replaceUjatRecruitVolunteerOverlay,
  resetUjatRecruitVolunteerOverlay,
} from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/ujat-recruit-volunteer-overlay-sync'
import { programToDetailEditValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  applyUjatRecruitInstitutionOverlayOntoProgram,
  buildUjatRecruitInstitutionOverlayFromDetailEditValues,
  UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS as INSTITUTION_KEYS,
} from '@/features/program/ujat/lib/ujat-recruit-institution-template-merge'
import {
  applyUjatRecruitVolunteerOverlayOntoProgram,
  UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS as VOLUNTEER_KEYS,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-template-merge'
import {
  applyUjatRecruitAnnouncementTitleToDraft,
  resolveUjatRecruitAnnouncementTitle,
  resolveUjatRecruitDisplayProgram,
} from '@/features/program/ujat/lib/ujat-recruit-display-program'
import { buildUjatRecruitVolunteerHalfOverlayFromDetailEditValues } from '@/features/program/ujat/lib/ujat-recruit-volunteer-half-overlay'
import { resolveUjatVolunteerActivityTermDisplay } from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-program-round'
import { UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM } from '@/features/program/ujat/lib/ujat-institution-recruit-template-preview-program'
import { UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM } from '@/features/program/ujat/lib/ujat-volunteer-recruit-template-preview-program'

describe('UJAT recruit form overlay', () => {
  afterEach(() => {
    resetUjatRecruitInstitutionOverlay()
    resetUjatRecruitVolunteerOverlay()
  })

  it('학교 모집 문의처·공고명을 overlay에 넣고 다시 폼으로 복원한다', () => {
    const values = {
      ...programToDetailEditValues(UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM),
      announcementTitle: '참여 기관 모집 공고',
      recruitmentContactOrganizationName: 'JA Korea 문의',
      contactPhone: '02-6085-6028',
      contactEmail: 'recruit@jakorea.org',
      district: '서울 지역 초등학교',
      applicationMethod: '<p>온라인 신청서 제출</p>',
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
    expect(applied.generalCommonInfo?.announcementTitle).toBe(
      UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM.generalCommonInfo?.announcementTitle
    )
    expect(applied.mainTitle).toBe(UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM.mainTitle)
    const restored = programToUjatRecruitTemplateFormValues(
      {
        ...applied,
        ujatRegistrationOverlay: overlay,
      },
      'institution'
    )
    expect(restored.announcementTitle).toBe('참여 기관 모집 공고')
    expect(programToDetailEditValues(applied).announcementTitle).toBeUndefined()
    expect(restored.recruitmentContactOrganizationName).toBe('JA Korea 문의')
    expect(restored.contactPhone).toBe('02-6085-6028')
    expect(restored.district).toBe('서울 지역 초등학교')
    expect(restored.applicationMethod).toBe('<p>온라인 신청서 제출</p>')
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
    const overlay = buildUjatRecruitVolunteerHalfOverlayFromDetailEditValues(values, 'h1')
    expect(overlay['ujat.recruit.volunteer.h1.publicTitle']).toBe('봉사자 모집 공고')
    expect(overlay[VOLUNTEER_KEYS.activityTermH1]).toBe('3')
    expect(overlay['ujat.recruit.volunteer.h1.contact']).toEqual({
      name: 'UJAT 운영팀',
      phone: '010-1234-5678',
      email: 'volunteer@jakorea.org',
    })

    const applied = applyUjatRecruitVolunteerOverlayOntoProgram(
      UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      overlay
    )
    const restored = programToUjatRecruitTemplateFormValues(
      {
        ...applied,
        ujatRegistrationOverlay: overlay,
      },
      'volunteer',
      'h1'
    )
    expect(restored.announcementTitle).toBe('봉사자 모집 공고')
    expect(programToDetailEditValues(applied).announcementTitle).toBeUndefined()
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

  it('기관·봉사자 공고용 프로그램명은 서로·공통정보와 분리된다', () => {
    const program = {
      ...UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      generalCommonInfo: {
        ...UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM.generalCommonInfo,
        announcementTitle: '공통정보 제목',
      },
      ujatRegistrationOverlay: {
        [INSTITUTION_KEYS.publicTitle]: '기관 공고',
        [VOLUNTEER_KEYS.publicTitle]: '봉사자 공고',
        'ujat.recruit.volunteer.h1.publicTitle': '봉사자 공고',
      },
    }
    expect(resolveUjatRecruitAnnouncementTitle(program, 'institution')).toBe('기관 공고')
    expect(resolveUjatRecruitAnnouncementTitle(program, 'volunteer')).toBe('봉사자 공고')
    expect(programToUjatRecruitTemplateFormValues(program, 'institution').announcementTitle).toBe(
      '기관 공고'
    )
    expect(programToUjatRecruitTemplateFormValues(program, 'volunteer', 'h1').announcementTitle).toBe(
      '봉사자 공고'
    )

    const saved = applyUjatRecruitAnnouncementTitleToDraft({
      draft: {
        ...program,
        generalCommonInfo: {
          ...program.generalCommonInfo,
          announcementTitle: '기관 공고 수정',
        },
      },
      existing: program,
      title: '기관 공고 수정',
      kind: 'institution',
    })
    expect(saved.generalCommonInfo?.announcementTitle).toBe('공통정보 제목')
    expect(saved.ujatRegistrationOverlay?.[INSTITUTION_KEYS.publicTitle]).toBe('기관 공고 수정')
    expect(saved.ujatRegistrationOverlay?.[VOLUNTEER_KEYS.publicTitle]).toBe('봉사자 공고')
  })

  it('상반기 저장 시 공유 키만 있던 하반기 모집정보는 기존값을 유지한다', () => {
    const program = {
      ...UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      volunteerTargets: ['대학생'],
      ujatRegistrationOverlay: {
        [VOLUNTEER_KEYS.publicTitle]: '공유 공고',
        [VOLUNTEER_KEYS.volunteerTargets]: ['대학생'],
      },
    }
    const savedH1 = applyUjatRecruitAnnouncementTitleToDraft({
      draft: program,
      existing: program,
      title: '상반기만 수정',
      kind: 'volunteer_h1',
      values: {
        ...programToUjatRecruitTemplateFormValues(program, 'volunteer', 'h1'),
        announcementTitle: '상반기만 수정',
        volunteerTargets: ['고등학생'],
      },
    })
    expect(savedH1.ujatRegistrationOverlay?.['ujat.recruit.volunteer.h1.publicTitle']).toBe(
      '상반기만 수정'
    )
    expect(savedH1.ujatRegistrationOverlay?.['ujat.recruit.volunteer.h2.publicTitle']).toBe(
      '공유 공고'
    )
    expect(resolveUjatRecruitAnnouncementTitle(savedH1, 'volunteer_h1')).toBe('상반기만 수정')
    expect(resolveUjatRecruitAnnouncementTitle(savedH1, 'volunteer_h2')).toBe('공유 공고')
    expect(resolveUjatRecruitDisplayProgram(savedH1, 'volunteer_h2').volunteerTargets).toEqual([
      '대학생',
    ])
    expect(resolveUjatRecruitDisplayProgram(savedH1, 'volunteer_h1').volunteerTargets).toEqual([
      '고등학생',
    ])
  })

  it('프로그램 반기 overlay가 템플릿 공유 공고명보다 우선한다', () => {
    replaceUjatRecruitVolunteerOverlay({
      [VOLUNTEER_KEYS.publicTitle]: '템플릿 공유 공고',
    })
    const program = {
      ...UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      ujatRegistrationOverlay: {
        'ujat.recruit.volunteer.h1.publicTitle': '상반기 프로그램 공고',
        'ujat.recruit.volunteer.h2.publicTitle': '하반기 프로그램 공고',
      },
    }
    expect(programToUjatRecruitTemplateFormValues(program, 'volunteer', 'h1').announcementTitle).toBe(
      '상반기 프로그램 공고'
    )
    expect(programToUjatRecruitTemplateFormValues(program, 'volunteer', 'h2').announcementTitle).toBe(
      '하반기 프로그램 공고'
    )
  })

  it('상반기·하반기 봉사자 공고용 프로그램명은 서로 분리된다', () => {
    const program = {
      ...UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      ujatRegistrationOverlay: {
        [VOLUNTEER_KEYS.publicTitle]: '레거시 공유 공고',
        'ujat.recruit.volunteer.h1.publicTitle': '상반기 공고',
        'ujat.recruit.volunteer.h2.publicTitle': '하반기 공고',
      },
    }
    expect(resolveUjatRecruitAnnouncementTitle(program, 'volunteer_h1')).toBe('상반기 공고')
    expect(resolveUjatRecruitAnnouncementTitle(program, 'volunteer_h2')).toBe('하반기 공고')

    const savedH1 = applyUjatRecruitAnnouncementTitleToDraft({
      draft: program,
      existing: program,
      title: '상반기 공고 수정',
      kind: 'volunteer_h1',
      values: {
        ...programToUjatRecruitTemplateFormValues(program, 'volunteer', 'h1'),
        announcementTitle: '상반기 공고 수정',
      },
    })
    expect(savedH1.ujatRegistrationOverlay?.['ujat.recruit.volunteer.h1.publicTitle']).toBe(
      '상반기 공고 수정'
    )
    expect(savedH1.ujatRegistrationOverlay?.['ujat.recruit.volunteer.h2.publicTitle']).toBe(
      '하반기 공고'
    )
    expect(resolveUjatRecruitAnnouncementTitle(savedH1, 'volunteer_h2')).toBe('하반기 공고')
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

  it('상반기 입력은 하반기 공고용 프로그램명·대상에 연동되지 않는다', () => {
    const program = {
      ...UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      ujatRegistrationOverlay: {
        [INSTITUTION_KEYS.publicTitle]: '기관 공고용 프로그램명',
        'ujat.recruit.volunteer.h1.publicTitle': '상반기 공고용 프로그램명',
        'ujat.recruit.volunteer.h1.volunteerTargets': ['대학생'],
        'ujat.recruit.volunteer.h1.targetDetail': '상반기 대상 상세',
      },
    }
    const h1 = programToUjatRecruitTemplateFormValues(program, 'volunteer', 'h1')
    const h2 = programToUjatRecruitTemplateFormValues(program, 'volunteer', 'h2')
    expect(h1.announcementTitle).toBe('상반기 공고용 프로그램명')
    expect(h1.volunteerTargets).toEqual(['university'])
    expect(h1.volunteerTargetDetail).toBe('상반기 대상 상세')
    expect(h2.announcementTitle).toBe('')
    expect(h2.volunteerTargets).toEqual(['university', 'adult'])
    expect(h2.volunteerTargetDetail ?? '').toBe('')
    expect(resolveUjatRecruitAnnouncementTitle(program, 'volunteer_h2')).toBe('-')
  })

  it('참여 기관·봉사자 상하반기 안내는 recruitments[] 행을 쓰고 공통 문장으로 채우지 않는다', () => {
    const program = {
      ...UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      description: '공통 설명',
      recruitmentGuide: '공통 안내',
      programRecruitments: [
        {
          recruitmentType: 'PARTICIPANT',
          programDescription: '기관 설명',
          recruitmentGuide: '기관 안내',
          applicationMethod: null,
          learningSupportContent: null,
          additionalContentHtml: null,
          remarks: null,
        },
        {
          recruitmentType: 'VOLUNTEER',
          startAt: '2026-09-01T00:00:00Z',
          programDescription: '하반기 설명',
          recruitmentGuide: '하반기 안내',
          applicationMethod: null,
          learningSupportContent: null,
          additionalContentHtml: null,
          remarks: null,
        },
        {
          recruitmentType: 'VOLUNTEER',
          startAt: '2026-03-01T00:00:00Z',
          programDescription: '상반기 설명',
          recruitmentGuide: '상반기 안내',
          applicationMethod: null,
          learningSupportContent: null,
          additionalContentHtml: null,
          remarks: null,
        },
      ],
    }
    expect(resolveUjatRecruitDisplayProgram(program, 'institution').recruitmentGuide).toBe('기관 안내')
    expect(resolveUjatRecruitDisplayProgram(program, 'institution').description).toBe('기관 설명')
    expect(resolveUjatRecruitDisplayProgram(program, 'volunteer_h1').recruitmentGuide).toBe('상반기 안내')
    expect(resolveUjatRecruitDisplayProgram(program, 'volunteer_h2').recruitmentGuide).toBe('하반기 안내')
    expect(resolveUjatRecruitDisplayProgram(program, 'volunteer_h1').description).toBe('상반기 설명')
  })

  it('빈 모집 행이 등록 overlay 공고명·설명을 지우지 않는다', () => {
    const program = {
      ...UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      description: '',
      recruitmentGuide: '',
      ujatRegistrationOverlay: {
        [INSTITUTION_KEYS.publicTitle]: '등록한 기관 공고',
        [INSTITUTION_KEYS.description]: '등록한 프로그램 설명',
        [INSTITUTION_KEYS.recruitmentGuide]: '등록한 모집 안내',
      },
      programRecruitments: [
        {
          id: 11,
          recruitmentType: 'PARTICIPANT',
          programDescription: '',
          recruitmentGuide: '',
          applicationMethod: null,
          learningSupportContent: null,
          additionalContentHtml: null,
          remarks: null,
        },
      ],
    }
    const displayed = resolveUjatRecruitDisplayProgram(program, 'institution')
    expect(resolveUjatRecruitAnnouncementTitle(program, 'institution')).toBe('등록한 기관 공고')
    expect(displayed.description).toBe('등록한 프로그램 설명')
    expect(displayed.recruitmentGuide).toBe('등록한 모집 안내')
  })

  it('overlay가 없어도 모집 행 공고명·설명을 쓴다', () => {
    const program = {
      ...UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      description: '',
      ujatRegistrationOverlay: {},
      programRecruitments: [
        {
          id: 11,
          recruitmentType: 'PARTICIPANT',
          announcementTitle: '행에 남은 기관 공고',
          programDescription: '행에 남은 설명',
          recruitmentGuide: '행에 남은 안내',
        },
      ],
    }
    const displayed = resolveUjatRecruitDisplayProgram(program, 'institution')
    expect(resolveUjatRecruitAnnouncementTitle(program, 'institution')).toBe('행에 남은 기관 공고')
    expect(displayed.description).toBe('행에 남은 설명')
    expect(displayed.recruitmentGuide).toBe('행에 남은 안내')
  })
})
