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
  applyUjatRecruitFormValuesToProgram,
  applyUjatRecruitAnnouncementTitleToDraft,
  programToUjatRecruitCanonicalFormValues,
  resolveUjatRecruitAnnouncementTitle,
  resolveUjatRecruitCanonicalDisplayProgram,
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
    expect(
      programToUjatRecruitTemplateFormValues(program, 'volunteer', 'h1').announcementTitle
    ).toBe('봉사자 공고')

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
    expect(
      programToUjatRecruitTemplateFormValues(program, 'volunteer', 'h1').announcementTitle
    ).toBe('상반기 프로그램 공고')
    expect(
      programToUjatRecruitTemplateFormValues(program, 'volunteer', 'h2').announcementTitle
    ).toBe('하반기 프로그램 공고')
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

  it('봉사자 모집 기타사항은 row otherMatters로 저장한다', () => {
    const program = {
      ...UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      programRecruitments: [
        {
          id: 41,
          recruitmentType: 'VOLUNTEER',
          recruitTerm: 'FIRST_HALF' as const,
        },
      ],
    }
    const values = {
      ...programToUjatRecruitTemplateFormValues(program, 'volunteer', 'h1'),
      otherNotes: '봉사자 준비물 안내',
    }
    const saved = applyUjatRecruitAnnouncementTitleToDraft({
      draft: program,
      existing: program,
      title: values.announcementTitle,
      kind: 'volunteer_h1',
      values,
    })
    expect(saved.programRecruitments?.[0]?.otherMatters).toBe('봉사자 준비물 안내')
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
    expect(resolveUjatRecruitDisplayProgram(program, 'institution').recruitmentGuide).toBe(
      '기관 안내'
    )
    expect(resolveUjatRecruitDisplayProgram(program, 'institution').description).toBe('기관 설명')
    expect(resolveUjatRecruitDisplayProgram(program, 'volunteer_h1').recruitmentGuide).toBe(
      '상반기 안내'
    )
    expect(resolveUjatRecruitDisplayProgram(program, 'volunteer_h2').recruitmentGuide).toBe(
      '하반기 안내'
    )
    expect(resolveUjatRecruitDisplayProgram(program, 'volunteer_h1').description).toBe(
      '상반기 설명'
    )
  })

  it('빈 모집 행이 등록 overlay 공고명·설명을 지우고 빈 값으로 표시한다', () => {
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
          announcementTitle: null,
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
    expect(resolveUjatRecruitAnnouncementTitle(program, 'institution')).toBe('-')
    expect(displayed.description).toBe('')
    expect(displayed.recruitmentGuide).toBe('')
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

  it('활성 모집 상세의 RHF는 모집 행을 우선하고 stale 모집 overlay를 읽지 않는다', () => {
    const program = {
      ...UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      ujatRegistrationOverlay: {
        [INSTITUTION_KEYS.publicTitle]: '오래된 overlay 공고',
        [INSTITUTION_KEYS.description]: '오래된 overlay 설명',
      },
      programRecruitments: [
        {
          id: 101,
          recruitmentType: 'PARTICIPANT',
          targetType: 'ORGANIZATION',
          announcementTitle: '행 canonical 공고',
          programDescription: '행 canonical 설명',
          operationStartDate: '2027-01-01',
          operationEndDate: '2027-01-31',
          startAt: '2026-12-01T00:00:00Z',
          endAt: '2026-12-20T00:00:00Z',
        },
      ],
    }
    const displayed = resolveUjatRecruitCanonicalDisplayProgram(program, 'institution')
    const values = programToUjatRecruitCanonicalFormValues(program, 'institution')

    expect(displayed.description).toBe('행 canonical 설명')
    expect(displayed.startDate).toBe('2027-01-01')
    expect(values.announcementTitle).toBe('행 canonical 공고')
    expect(values.applicationStartDate).toBe('2026-12-01T00:00:00Z')
    expect(values.startDate).toBe('2027-01-01')
  })

  it('봉사자 H1/H2 canonical RHF와 저장은 recruitTerm·row id를 분리 보존한다', () => {
    const program = {
      ...UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      ujatRegistrationOverlay: {
        [VOLUNTEER_KEYS.publicTitle]: '공유 legacy 공고',
        'ujat.recruit.volunteer.h1.publicTitle': 'legacy H1',
        'ujat.recruit.volunteer.h2.publicTitle': 'legacy H2',
      },
      programRecruitments: [
        {
          id: 201,
          recruitmentType: 'VOLUNTEER',
          targetType: 'COLLEGE_STUDENT',
          recruitTerm: 'FIRST_HALF' as const,
          announcementTitle: 'canonical H1',
          startAt: '2027-01-01T00:00:00Z',
          endAt: '2027-01-31T00:00:00Z',
          operationStartDate: '2027-02-01',
          operationEndDate: '2027-06-30',
        },
        {
          id: 202,
          recruitmentType: 'VOLUNTEER',
          targetType: 'COLLEGE_STUDENT',
          recruitTerm: 'SECOND_HALF' as const,
          announcementTitle: 'canonical H2',
          startAt: '2027-07-01T00:00:00Z',
          endAt: '2027-07-31T00:00:00Z',
          operationStartDate: '2027-08-01',
          operationEndDate: '2027-12-31',
        },
      ],
    }
    const h1 = programToUjatRecruitCanonicalFormValues(program, 'volunteer_h1')
    const h2 = programToUjatRecruitCanonicalFormValues(program, 'volunteer_h2')
    expect(h1.rounds?.[0]?.startDate).toBe('2027-01-01T00:00:00Z')
    expect(h1.rounds?.[0]?.endDate).toBe('2027-01-31T00:00:00Z')
    const changedPeriod = applyUjatRecruitFormValuesToProgram(program, 'volunteer_h1', {
      ...h1,
      rounds: h1.rounds.map((round, index) =>
        index === 0
          ? { ...round, startDate: '2027-02-01T00:00:00Z', endDate: '2027-02-28T00:00:00Z' }
          : round
      ),
    })
    const savedH1 = applyUjatRecruitFormValuesToProgram(program, 'volunteer_h1', {
      ...h1,
      announcementTitle: '수정 H1',
    })

    expect(h1.announcementTitle).toBe('canonical H1')
    expect(h2.announcementTitle).toBe('canonical H2')
    expect(savedH1.programRecruitments?.find(row => row.id === 201)?.announcementTitle).toBe(
      '수정 H1'
    )
    expect(savedH1.programRecruitments?.find(row => row.id === 202)?.announcementTitle).toBe(
      'canonical H2'
    )
    expect(savedH1.programRecruitments?.find(row => row.id === 201)?.recruitTerm).toBe(
      'FIRST_HALF'
    )
    expect(changedPeriod.programRecruitments?.find(row => row.id === 201)?.startAt).toBe(
      '2027-02-01T00:00:00Z'
    )
    expect(savedH1.ujatRegistrationOverlay).toEqual(program.ujatRegistrationOverlay)
  })

  it('등록 위저드에서만 없는 기관·H1·H2 행을 typed 값으로 만들고 legacy overlay는 건드리지 않는다', () => {
    const base = {
      ...UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      ujatRegistrationOverlay: { stale: 'keep' },
      programRecruitments: [],
    }
    const institutionValues = {
      ...programToDetailEditValues(base),
      announcementTitle: '기관 모집',
      applicationStartDate: '2027-01-01T00:00:00Z',
      applicationEndDate: '2027-01-31T00:00:00Z',
    }
    const h1Values = {
      ...programToDetailEditValues(base),
      announcementTitle: 'H1 모집',
      volunteerApplicationStartDate: '2027-02-01T00:00:00Z',
      volunteerApplicationEndDate: '2027-02-28T00:00:00Z',
    }
    const h2Values = {
      ...programToDetailEditValues(base),
      announcementTitle: 'H2 모집',
      volunteerApplicationStartDate: '2027-08-01T00:00:00Z',
      volunteerApplicationEndDate: '2027-08-31T00:00:00Z',
    }
    const typed = applyUjatRecruitFormValuesToProgram(
      applyUjatRecruitFormValuesToProgram(
        applyUjatRecruitFormValuesToProgram(base, 'institution', institutionValues, {
          createMissing: true,
        }),
        'volunteer_h1',
        h1Values,
        { createMissing: true }
      ),
      'volunteer_h2',
      h2Values,
      { createMissing: true }
    )

    expect(typed.programRecruitments?.map(row => [row.id, row.recruitTerm ?? null])).toEqual([
      [undefined, null],
      [undefined, 'FIRST_HALF'],
      [undefined, 'SECOND_HALF'],
    ])
    expect(typed.programRecruitments?.map(row => row.announcementTitle)).toEqual([
      '기관 모집',
      'H1 모집',
      'H2 모집',
    ])
    expect(typed.ujatRegistrationOverlay).toEqual(base.ujatRegistrationOverlay)
  })

  it('H2 수정 후 H1 row id·공고명·recruitTerm은 그대로다', () => {
    const program = {
      ...UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      programRecruitments: [
        {
          id: 201,
          recruitmentType: 'VOLUNTEER',
          recruitTerm: 'FIRST_HALF' as const,
          announcementTitle: 'canonical H1',
        },
        {
          id: 202,
          recruitmentType: 'VOLUNTEER',
          recruitTerm: 'SECOND_HALF' as const,
          announcementTitle: 'canonical H2',
        },
      ],
    }
    const h2 = programToUjatRecruitCanonicalFormValues(program, 'volunteer_h2')
    const savedH2 = applyUjatRecruitFormValuesToProgram(program, 'volunteer_h2', {
      ...h2,
      announcementTitle: '수정 H2',
    })
    expect(savedH2.programRecruitments?.find(row => row.id === 201)).toMatchObject({
      announcementTitle: 'canonical H1',
      recruitTerm: 'FIRST_HALF',
    })
    expect(savedH2.programRecruitments?.find(row => row.id === 202)).toMatchObject({
      announcementTitle: '수정 H2',
      recruitTerm: 'SECOND_HALF',
    })
  })

  it('기존 row가 있으면 신규 row를 만들지 않고 id·첨부·양식 바인딩을 유지한다', () => {
    const program = {
      ...UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      programRecruitments: [
        {
          id: 101,
          recruitmentType: 'PARTICIPANT',
          targetType: 'ORGANIZATION',
          announcementTitle: '기존 공고',
          thumbnailFileObjectId: 88,
          applicationFormBindingId: 77,
          attachments: [{ fileObjectId: 9, originalFileName: 'guide.pdf' }],
        },
      ],
    }
    const values = {
      ...programToUjatRecruitCanonicalFormValues(program, 'institution'),
      announcementTitle: '수정 공고',
    }
    const saved = applyUjatRecruitFormValuesToProgram(program, 'institution', values)
    expect(saved.programRecruitments).toHaveLength(1)
    expect(saved.programRecruitments?.[0]).toMatchObject({
      id: 101,
      announcementTitle: '수정 공고',
      thumbnailFileObjectId: 88,
      applicationFormBindingId: 77,
      attachments: [{ fileObjectId: 9, originalFileName: 'guide.pdf' }],
    })
  })

  it('createMissing 없이 행이 없으면 신규 row를 만들지 않는다', () => {
    const program = {
      ...UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      programRecruitments: [],
    }
    const values = {
      ...programToDetailEditValues(program),
      announcementTitle: '새 공고',
      applicationStartDate: '2027-01-01T00:00:00Z',
    }
    const next = applyUjatRecruitFormValuesToProgram(program, 'institution', values)
    expect(next.programRecruitments).toEqual([])
  })

  it('활성 상세는 행이 없으면 stale Overlay 공고명을 넣지 않는다', () => {
    const program = {
      ...UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      programRecruitments: [],
      ujatRegistrationOverlay: {
        [INSTITUTION_KEYS.publicTitle]: '오래된 overlay 공고',
        'ujat.recruit.volunteer.h1.publicTitle': '오래된 H1 overlay',
      },
    }
    expect(resolveUjatRecruitAnnouncementTitle(program, 'institution', {
      allowOverlayFallback: false,
    })).toBe('-')
    expect(
      resolveUjatRecruitAnnouncementTitle(program, 'volunteer_h1', {
        allowOverlayFallback: false,
      })
    ).toBe('-')
    expect(programToUjatRecruitCanonicalFormValues(program, 'institution').announcementTitle).not.toBe(
      '오래된 overlay 공고'
    )
  })

  it('모집 탭 PATCH에서 registrationOverlay를 다시 실을 대상이 아니다', () => {
    const program = {
      ...UJAT_INSTITUTION_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      ujatRegistrationOverlay: { stale: 'keep' },
      registrationOverlay: { stale: 'legacy' },
      programRecruitments: [
        { id: 101, recruitmentType: 'PARTICIPANT', announcementTitle: '행 공고' },
      ],
    }
    const patch = {
      registrationOverlay: program.registrationOverlay,
      programRecruitments: program.programRecruitments,
    }
    const { registrationOverlay: _omitRegistrationOverlay, ...recruitPatch } = patch
    const saved = applyUjatRecruitFormValuesToProgram(
      program,
      'institution',
      programToUjatRecruitCanonicalFormValues(program, 'institution')
    )
    expect(recruitPatch).not.toHaveProperty('registrationOverlay')
    expect(saved.ujatRegistrationOverlay).toEqual({ stale: 'keep' })
  })

  it('봉사자 H1 interviewConfig와 volunteerTargets 기타를 해당 행에만 쓴다', () => {
    const program = {
      ...UJAT_VOLUNTEER_RECRUIT_TEMPLATE_PREVIEW_PROGRAM,
      programRecruitments: [
        {
          id: 201,
          recruitmentType: 'VOLUNTEER',
          recruitTerm: 'FIRST_HALF' as const,
          interviewConfig: { schemaVersion: 1 as const, selectedSlotKeys: [] },
        },
        {
          id: 202,
          recruitmentType: 'VOLUNTEER',
          recruitTerm: 'SECOND_HALF' as const,
          interviewConfig: {
            schemaVersion: 1 as const,
            selectedSlotKeys: ['keep-h2'],
          },
        },
      ],
    }
    const values = {
      ...programToUjatRecruitCanonicalFormValues(program, 'volunteer_h1'),
      volunteerTargets: ['elementary', '기타'],
      volunteerInterviewConfig: {
        schemaVersion: 1,
        selectedSlotKeys: ['111-222'],
        interviewTimeRange: [],
        exceptions: [],
      },
    }
    const saved = applyUjatRecruitFormValuesToProgram(program, 'volunteer_h1', values)
    expect(saved.programRecruitments?.find(row => row.id === 201)?.volunteerTargets).toEqual([
      'elementary',
      '기타',
    ])
    expect(saved.programRecruitments?.find(row => row.id === 201)?.interviewConfig).toMatchObject({
      selectedSlotKeys: ['111-222'],
    })
    expect(saved.programRecruitments?.find(row => row.id === 202)?.interviewConfig).toMatchObject({
      selectedSlotKeys: ['keep-h2'],
    })
  })
})
