import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { SPONSOR_CONTACT_UNSELECTED_VALUE } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import {
  detailEditValuesToProgramPatch,
  narrowProgramDetailPatchForCommonInfoSave,
  programDetailCompanySchoolCommonInfoEditSchema,
  programDetailEditSchema,
  programDetailTrainedTeachersCommonInfoEditSchema,
  programDetailUjatCommonInfoEditSchema,
  programToDetailEditValues,
  volunteerDocumentInterviewNestedPatch,
} from './program-detail-edit-schema'
import { mapCompanySchoolToUpdateRequest } from '@/features/program/1c-1s/api/adapters'

const program = {
  id: 'program-1',
  title: '기존 제목',
  category: 'school',
  type: 'offline',
  format: 'workshop',
  status: 'active',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  sponsorId: 'sponsor-1',
  managerName: '담당자',
  description: '설명',
  learningSupportContent: '지원',
  applicationStartDate: '2026-01-01',
  applicationEndDate: '2026-01-31',
  resultAnnouncementDate: '2026-02-01',
  resultAnnouncementMethod: '개별 안내',
  rounds: [],
  generalCommonInfo: {
    announcementTitle: '기존 공고명',
    detailedProgramName: '기존 세부명',
  },
} as Program

describe('narrowProgramDetailPatchForCommonInfoSave', () => {
  it('공통정보 저장 patch → update request 에 모집 JSON 이 실리지 않는다', () => {
    const loaded = {
      ...program,
      id: '186024',
      title: '우리 동네 소비와 저축',
      mainTitle: '우리 동네 소비와 저축',
      applicationStartDate: '2026-10-03',
      applicationEndDate: '2026-10-07',
      studentListRequired: 'required',
      registrationOverlay: {
        'economyRegistration.wageInfo.paymentItemValues': ['p-166201', 'p-166204'],
      },
      generalCommonInfo: {
        participantRecruitmentInfo: {
          recruitmentPeriodLabel: '2026.10.03 ~ 2026.10.07',
          preEducationNoticeRequired: true,
        },
        kpi: {
          finalParticipants: 36,
          instructorCount: 7,
          volunteerCount: 0,
          finalSchools: 9,
          finalClasses: 13,
        },
        wageGradeRows: [{ grade: '1급 강사비', pricing: '기본 140,000원' }],
      },
    } as Program
    const values = {
      ...programToDetailEditValues(loaded),
      mainTitle: '우리 동네 소비와 저축11',
    }
    const patch = narrowProgramDetailPatchForCommonInfoSave(
      detailEditValuesToProgramPatch(values, loaded)
    )
    const request = mapCompanySchoolToUpdateRequest({ ...loaded, ...patch, id: loaded.id }, patch)
    const parsed =
      request.serviceDetailJson != null
        ? (JSON.parse(request.serviceDetailJson) as {
            program?: { generalCommonInfo?: Record<string, unknown> }
            registration?: unknown
          })
        : null

    expect(request.applicationStartDate).toBeUndefined()
    expect(request.applicationEndDate).toBeUndefined()
    expect(request.rounds).toBeUndefined()
    expect(parsed?.program?.generalCommonInfo?.participantRecruitmentInfo).toBeUndefined()
    expect(parsed?.registration).toBeUndefined()
  })

  it('모집·회차 필드를 remote patch 에서 제외한다', () => {
    const patch = detailEditValuesToProgramPatch(
      {
        ...programToDetailEditValues(program),
        mainTitle: '수정 제목',
      },
      program
    )
    const narrowed = narrowProgramDetailPatchForCommonInfoSave(patch)

    expect(narrowed.mainTitle).toBe('수정 제목')
    expect(narrowed.applicationStartDate).toBeUndefined()
    expect(narrowed.applicationEndDate).toBeUndefined()
    expect(narrowed.rounds).toBeUndefined()
    expect(narrowed.generalCommonInfo?.participantRecruitmentInfo).toBeUndefined()
    expect(narrowed.generalCommonInfo?.instructorRecruitmentInfo).toBeUndefined()
    expect(narrowed.generalCommonInfo?.volunteerRecruitmentInfo).toBeUndefined()
    expect(narrowed.generalCommonInfo?.kpi).toBeTruthy()
  })
})

describe('programDetailCompanySchoolCommonInfoEditSchema', () => {
  it('공통정보 탭에 없는 managerName·모집 필드 없어도 후원사만 있으면 저장 검증을 통과한다', () => {
    const values = {
      ...programToDetailEditValues({
        ...program,
        managerName: undefined,
        description: undefined,
        learningSupportContent: undefined,
        applicationStartDate: undefined,
        applicationEndDate: undefined,
        resultAnnouncementDate: undefined,
        resultAnnouncementMethod: undefined,
      } as unknown as Program),
      managerName: '',
      description: '',
      learningSupportContent: '',
      applicationStartDate: '',
      applicationEndDate: '',
      resultAnnouncementDate: '',
      resultAnnouncementMethod: '',
      sponsorId: '163384',
      sponsorManagementIds: ['163384'],
    }

    expect(programDetailCompanySchoolCommonInfoEditSchema.safeParse(values).success).toBe(true)
    expect(programDetailEditSchema.safeParse(values).success).toBe(false)
  })
})

describe('programDetailUjatCommonInfoEditSchema', () => {
  it('UJAT 공통정보 탭에 없는 모집 필수값이 비어도 저장 검증을 통과한다', () => {
    const values = {
      ...programToDetailEditValues({
        ...program,
        backendProgramType: 'UJAT',
        managerName: undefined,
        description: undefined,
        learningSupportContent: undefined,
        applicationStartDate: undefined,
        applicationEndDate: undefined,
        resultAnnouncementDate: undefined,
        resultAnnouncementMethod: undefined,
      } as unknown as Program),
      managerName: '',
      description: '',
      learningSupportContent: '',
      applicationStartDate: '',
      applicationEndDate: '',
      resultAnnouncementDate: '',
      resultAnnouncementMethod: '',
      sponsorId: '163384',
      sponsorManagementIds: ['163384'],
    }

    expect(programDetailUjatCommonInfoEditSchema.safeParse(values).success).toBe(true)
    expect(programDetailEditSchema.safeParse(values).success).toBe(false)
  })
})

describe('program detail trained teachers boolean fields', () => {
  it('partnerInvolvement null 을 허용한다', () => {
    const values = {
      ...programToDetailEditValues(program),
      partnerInvolvement: null,
      mainTitle: '대표 프로그램명',
      titleEn: 'Program Title',
      announcementTitle: '공고용 프로그램명',
      detailedProgramId: '1001',
      businessArea: '경제금융',
      educationProcess: 'elementary',
      ipOwned: 'JA',
      courseDeliveredBy: 'JA' as const,
    }

    const result = programDetailTrainedTeachersCommonInfoEditSchema.safeParse(values)
    expect(result.success).toBe(true)
  })

  it('사업 분야 코드는 마스터명으로 정규화해 수정 폼에 채운다', () => {
    const values = programToDetailEditValues({
      ...program,
      businessArea: 'digital_literacy',
    })
    expect(values.businessArea).toBe('디지털리터러시')

    const patch = detailEditValuesToProgramPatch(
      { ...values, businessArea: 'career_employment' },
      program
    )
    expect(patch.businessArea).toBe('진로취업')
  })

  it('GET lowercase courseDeliveredBy/ipOwned 를 상세 폼 PascalCase 로 시드한다', () => {
    const values = programToDetailEditValues({
      ...program,
      backendProgramType: 'TRAINED_TEACHER',
      courseDeliveredBy: 'ja' as Program['courseDeliveredBy'],
      ipOwned: 'ja',
    })
    expect(values.courseDeliveredBy).toBe('JA')
    expect(values.ipOwned).toBe('JA')
    expect(
      programDetailTrainedTeachersCommonInfoEditSchema.safeParse({
        ...values,
        mainTitle: '대표 프로그램명',
        titleEn: 'Program Title',
        announcementTitle: '공고용 프로그램명',
        detailedProgramId: '1001',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        businessArea: '경제금융',
        educationProcess: 'Digital',
      }).success
    ).toBe(true)
  })

  it('비어 있는 Course Delivered By 를 JA 로 채우지 않는다', () => {
    const values = programToDetailEditValues({
      ...program,
      backendProgramType: 'TRAINED_TEACHER',
      courseDeliveredBy: undefined,
      ipOwned: undefined,
    })
    expect(values.courseDeliveredBy).toBeUndefined()
    expect(values.ipOwned).toBeUndefined()
  })

  it('programToDetailEditValues 는 partnerInvolvement null 을 false 로 정규화한다', () => {
    const values = programToDetailEditValues({
      ...program,
      partnerInvolvement: null,
    } as unknown as Program)

    expect(values.partnerInvolvement).toBe(false)
  })
})

describe('programToDetailEditValues contactPhone (모집 문의처)', () => {
  it('후원사 담당자 미선택이어도 nested inquiryTel 을 수정 폼에 채운다', () => {
    const values = programToDetailEditValues({
      ...program,
      id: '186005',
      managerName: '미선택',
      contactPhone: undefined,
      generalCommonInfo: {
        ...program.generalCommonInfo,
        sponsorManagerContactIds: [SPONSOR_CONTACT_UNSELECTED_VALUE],
        sponsorManagerLine: '미선택',
        participantRecruitmentInfo: {
          inquiryTel: '010-8681-6741',
          inquiryEmail: 'bjh1234@tinto.co.kr',
          contactOrganizationName: '로컬나눔은행',
        },
      },
    } as Program)

    expect(values.contactPhone).toBe('010-8681-6741')
  })

  it('top-level 마스킹 전화보다 nested 모집 Tel 을 우선한다', () => {
    const values = programToDetailEditValues({
      ...program,
      id: '186005',
      contactPhone: '010-****-7253',
      generalCommonInfo: {
        ...program.generalCommonInfo,
        participantRecruitmentInfo: {
          inquiryTel: '02-6085-6028',
        },
      },
    } as Program)

    expect(values.contactPhone).toBe('02-6085-6028')
  })

  it('마스킹만 있으면 contactPhone 을 비워 잘못된 하이픈 포맷을 막는다', () => {
    const values = programToDetailEditValues({
      ...program,
      contactPhone: '010-****-7253',
      generalCommonInfo: {
        ...program.generalCommonInfo,
        participantRecruitmentInfo: {},
      },
    } as Program)

    expect(values.contactPhone).toBeUndefined()
  })

  it('TT 는 담당자 미선택·nested 비어 있어도 top-level 평문 Tel 폴백을 유지한다', () => {
    const values = programToDetailEditValues({
      ...program,
      id: '186005',
      managerName: '미선택',
      contactPhone: '010-8681-6741',
      generalCommonInfo: {
        ...program.generalCommonInfo,
        sponsorManagerContactIds: [SPONSOR_CONTACT_UNSELECTED_VALUE],
        participantRecruitmentInfo: {},
      },
    } as Program)

    expect(values.contactPhone).toBe('010-8681-6741')
  })
})

describe('programToDetailEditValues keeps stored common info in edit fields', () => {
  it('공고명·세부명·일정명·진행 시간·IPS 상세를 수정 폼에 채운다', () => {
    const values = programToDetailEditValues({
      ...program,
      id: '186034',
      backendProgramType: 'TRAINED_TEACHER',
      title: '교육받은교사(수정4)',
      mainTitle: '대표명',
      textbookName: '사회공헌 프로젝트',
      sponsorId: '1627251',
      managerName: '백진혁',
      venue: '별관 301호',
      generalProgramEducationStructure: 'schedule',
      generalProgramSessionRound: 'single',
      generalCommonInfo: {
        announcementTitle: '교육받은교사(수정4)',
        detailedProgramName: '사회공헌 프로젝트',
        sponsorManagementIds: ['1627251'],
        venueDetail: '별관 301호',
        educationFormLabel: '오프라인',
        scheduleDetails: [
          {
            scheduleLabel: '세부 일정 01',
            name: '교육받은교사(수정3)',
            progressTimeSummary: '15:43 ~ 16:43',
            ipsTypeSummary: 'Inspire | Kick-Off event (킥오프 행사)',
          },
        ],
      },
    } as Program)

    expect(values.announcementTitle).toBe('교육받은교사(수정4)')
    expect(values.mainTitle).toBe('대표명')
    expect(values.detailedProgramName).toBe('사회공헌 프로젝트')
    expect(values.textbookName).toBe('사회공헌 프로젝트')
    expect(values.sponsorManagementIds).toEqual(['1627251'])
    expect(values.managerName).toBe('백진혁')
    expect(values.venueDetail).toBe('별관 301호')
    expect(values.educationStructure).toBe('schedule')
    expect(values.sessionRound).toBe('single')
    expect(values.educationForm).toBe('offline')
    expect(values.educationFormScheduleDetail).toBeUndefined()
    expect(values.ipsScheduleDetail).toBeUndefined()
    expect(values.ipsCategory).toBe('inspire')
    expect(values.ipsDetail).toBe('kick_off_event')
  })

  it('루트 IPS가 없어도 일정 행의 IPS 문구로 수정 셀렉트를 채운다', () => {
    const values = programToDetailEditValues({
      ...program,
      generalCommonInfo: {
        scheduleDetails: [
          {
            scheduleLabel: '세부 일정 01',
            name: '교육받은교사(수정3)',
            ipsTypeSummary: 'Inspire | Kick-Off event (킥오프 행사)',
          },
        ],
      },
    } as Program)

    expect(values.ipsCategory).toBe('inspire')
    expect(values.ipsDetail).toBe('kick_off_event')
  })

  it('저장된 담당자가 미선택이면 수정 폼에도 미선택이 체크된다', () => {
    const values = programToDetailEditValues({
      ...program,
      managerName: '미선택',
      generalCommonInfo: {
        sponsorManagerContactIds: [],
        sponsorManagerLine: '미선택',
      },
    } as Program)

    expect(values.sponsorManagerContactIds).toEqual([SPONSOR_CONTACT_UNSELECTED_VALUE])
    expect(values.sponsorManagerContactId).toBe(SPONSOR_CONTACT_UNSELECTED_VALUE)
  })

  it('후원사만 있고 담당자 표시가 비어도 수정 폼에 미선택이 체크된다', () => {
    const values = programToDetailEditValues({
      ...program,
      sponsorId: '1627251',
      managerName: '',
      generalCommonInfo: {
        sponsorManagementIds: ['1627251'],
        sponsorManagerContactIds: [],
        sponsorManagerLine: '',
      },
    } as Program)

    expect(values.sponsorManagerContactIds).toEqual([SPONSOR_CONTACT_UNSELECTED_VALUE])
    expect(values.sponsorManagerContactId).toBe(SPONSOR_CONTACT_UNSELECTED_VALUE)
  })
})

describe('program detail title edit fields', () => {
  it('공고용 프로그램명과 세부 프로그램명을 title/textbookName과 섞지 않는다', () => {
    const values = {
      ...programToDetailEditValues({
        ...program,
        title: '대표명',
        mainTitle: '대표명',
        textbookName: '진짜 교재명',
        generalCommonInfo: {
          announcementTitle: '기존 공고명',
          detailedProgramName: '기존 세부명',
        },
      } as Program),
      announcementTitle: '수정 공고명',
      detailedProgramName: '수정 세부명',
    }

    const patch = detailEditValuesToProgramPatch(values, {
      ...program,
      title: '대표명',
      textbookName: '진짜 교재명',
    } as Program)

    expect(patch.title).toBe('대표명')
    expect(patch.mainTitle).toBe('대표명')
    expect(patch.textbookName).toBe('진짜 교재명')
    expect(patch.generalCommonInfo?.announcementTitle).toBe('수정 공고명')
    expect(patch.generalCommonInfo?.detailedProgramName).toBe('수정 세부명')
  })

  it('교육받은 교사는 교재명과 세부 프로그램명을 섞지 않는다', () => {
    const existing = {
      ...program,
      id: '186312',
      backendProgramType: 'TRAINED_TEACHER',
      title: '기존 공고명',
      textbookName: '1사1교 금융특강',
      detailedProgramId: '163009',
      generalCommonInfo: {
        announcementTitle: '기존 공고명',
        detailedProgramName: 'UJAT 사전교육',
      },
    } as Program
    const values = {
      ...programToDetailEditValues(existing),
      announcementTitle: '수정 공고명',
      textbookName: '수정 교재명',
      detailedProgramName: 'UJAT 사전교육',
      sponsorManagerContactIds: [],
    }
    const patch = detailEditValuesToProgramPatch(values, existing)
    expect(patch.title).toBe('수정 공고명')
    expect(patch.textbookName).toBe('수정 교재명')
    expect(patch.detailedProgramId).toBe('163009')
    expect(patch.generalCommonInfo?.announcementTitle).toBe('수정 공고명')
    expect(patch.generalCommonInfo?.detailedProgramName).toBe('UJAT 사전교육')
    expect(patch.generalCommonInfo?.sponsorManagerContactIds).toEqual([])
    expect(patch.generalCommonInfo?.sponsorManagerContactId).toBeUndefined()
  })

  it('교육 장소 라디오(venueKind)를 generalCommonInfo에 저장하고 다시 로드한다', () => {
    const values = {
      ...programToDetailEditValues({
        ...program,
        institutionType: 'inside_school',
        generalCommonInfo: {
          ...program.generalCommonInfo,
          venueKind: 'inside',
          venueDetail: '본관',
        },
      }),
      venueKind: 'outside' as const,
      venueDetail: '외부 강의실',
    }
    const patch = detailEditValuesToProgramPatch(values, {
      ...program,
      institutionType: 'inside_school',
    })
    expect(patch.institutionType).toBe('outside_school')
    expect(patch.generalCommonInfo?.venueKind).toBe('outside')
    expect(patch.generalCommonInfo?.venueDetail).toBe('외부 강의실')

    const reloaded = programToDetailEditValues({
      ...program,
      ...patch,
      generalCommonInfo: {
        ...program.generalCommonInfo,
        ...patch.generalCommonInfo,
      },
    } as Program)
    expect(reloaded.venueKind).toBe('outside')
    expect(reloaded.venueDetail).toBe('외부 강의실')
  })

  it('공고용명·세부명은 title/textbookName으로 채우지 않는다', () => {
    const values = programToDetailEditValues({
      ...program,
      title: '대표 프로그램명',
      mainTitle: '대표 프로그램명',
      textbookName: '필요와 욕구, 현명한 소비',
      generalCommonInfo: {},
    } as Program)

    expect(values.announcementTitle).toBeUndefined()
    expect(values.detailedProgramName).toBeUndefined()
  })

  it('대표 프로그램명 변경은 mainTitle만 바꾸고 관리명(title)은 유지한다', () => {
    const values = {
      ...programToDetailEditValues({
        ...program,
        title: '생성 당시명',
        mainTitle: '생성 당시명',
      } as Program),
      mainTitle: '수정1',
    }

    const patch = detailEditValuesToProgramPatch(values, {
      ...program,
      title: '생성 당시명',
      mainTitle: '생성 당시명',
    } as Program)

    expect(patch.title).toBe('생성 당시명')
    expect(patch.mainTitle).toBe('수정1')
  })

  it('UJAT는 대표명을 바꿔도 관리명(title)을 덮지 않는다', () => {
    const values = {
      ...programToDetailEditValues({
        ...program,
        title: '프로그램 관리명',
        mainTitle: '생성 당시 대표명',
        ujatProgressStatus: 'VOLUNTEER_RECRUITING',
      } as Program),
      mainTitle: '수정한 대표명',
    }

    const patch = detailEditValuesToProgramPatch(values, {
      ...program,
      title: '프로그램 관리명',
      mainTitle: '생성 당시 대표명',
      ujatProgressStatus: 'VOLUNTEER_RECRUITING',
    } as Program)

    expect(patch.title).toBe('프로그램 관리명')
    expect(patch.mainTitle).toBe('수정한 대표명')
  })
})

describe('general recruitment contact edit', () => {
  it('일반 프로그램도 문의처 기관명을 저장한다', () => {
    const values = {
      ...programToDetailEditValues(program),
      recruitmentContactOrganizationName: 'JA Korea 문의',
      contactPhone: '02-6085-6028',
      contactEmail: 'recruit@jakorea.org',
    }
    const patch = detailEditValuesToProgramPatch(values, program)
    expect(patch.generalCommonInfo?.participantRecruitmentInfo?.contactOrganizationName).toBe(
      'JA Korea 문의'
    )
    expect(patch.generalCommonInfo?.participantRecruitmentInfo?.inquiryTel).toBe('02-6085-6028')
    expect(patch.generalCommonInfo?.participantRecruitmentInfo?.inquiryEmail).toBe(
      'recruit@jakorea.org'
    )
  })

  it('문의처 수정 시 옛 contactName 별칭을 같은 값으로 맞춘다', () => {
    const loaded = {
      ...program,
      contactName: '최수아',
      generalCommonInfo: {
        participantRecruitmentInfo: {
          contactOrganizationName: '최수아',
          contactName: '최수아',
        },
      },
    } as Program
    const values = {
      ...programToDetailEditValues(loaded),
      recruitmentContactOrganizationName: '황유정',
    }
    const patch = detailEditValuesToProgramPatch(values, loaded)
    expect(patch.generalCommonInfo?.participantRecruitmentInfo?.contactOrganizationName).toBe(
      '황유정'
    )
    expect(patch.generalCommonInfo?.participantRecruitmentInfo?.contactName).toBe('황유정')
    expect(patch.contactName).toBe('황유정')
  })

  it('강사·봉사자 문의처는 각 RecruitmentInfo에 저장한다', () => {
    const values = {
      ...programToDetailEditValues(program),
      instructorRecruitmentContactOrganizationName: '강사 문의처',
      instructorContactPhone: '010-1111-2222',
      instructorContactEmail: 'instructor@jakorea.org',
      volunteerRecruitmentContactOrganizationName: '봉사자 문의처',
      volunteerContactPhone: '010-3333-4444',
      volunteerContactEmail: 'volunteer@jakorea.org',
    }
    const patch = detailEditValuesToProgramPatch(values, program)
    expect(patch.generalCommonInfo?.instructorRecruitmentInfo?.contactOrganizationName).toBe(
      '강사 문의처'
    )
    expect(patch.generalCommonInfo?.instructorRecruitmentInfo?.inquiryTel).toBe('010-1111-2222')
    expect(patch.generalCommonInfo?.volunteerRecruitmentInfo?.contactOrganizationName).toBe(
      '봉사자 문의처'
    )
    expect(patch.generalCommonInfo?.volunteerRecruitmentInfo?.inquiryEmail).toBe(
      'volunteer@jakorea.org'
    )
  })
})

describe('봉사자 서류·면접 nested 저장', () => {
  it('폼 값을 volunteerRecruitmentInfo nested에 반영한다', () => {
    const existing = {
      documentPassAnnouncementDate: '2026-09-01T00:00:00+09:00',
      documentPassAnnouncementMethod: '공용 예전',
      interviewStartDate: '2026-09-10T00:00:00+09:00',
      interviewEndDate: '2026-09-12T00:00:00+09:00',
      interviewMethod: '대면',
    }
    const values = {
      ...programToDetailEditValues(program),
      documentPassAnnouncementDate: '2026-11-05T00:00:00+09:00',
      documentPassAnnouncementMethod: '이메일',
      interviewStartDate: '2026-11-10T00:00:00+09:00',
      interviewEndDate: '2026-11-12T00:00:00+09:00',
      interviewMethod: '온라인',
    }
    const nested = volunteerDocumentInterviewNestedPatch(values, existing)
    expect(nested.documentPassAnnouncementMethod).toBe('이메일')
    expect(nested.interviewMethod).toBe('온라인')
    expect(nested.documentPassAnnouncementDate).toBe(
      new Date('2026-11-05T00:00:00+09:00').toISOString()
    )
    expect(nested.interviewStartDate).toBe(new Date('2026-11-10T00:00:00+09:00').toISOString())
  })

  it('폼에서 지운 서류·면접 값은 nested existing으로 복원하지 않는다', () => {
    const existing = {
      documentPassAnnouncementDate: '2026-09-01T00:00:00+09:00',
      documentPassAnnouncementMethod: '공용 예전',
      interviewStartDate: '2026-09-10T00:00:00+09:00',
      interviewEndDate: '2026-09-12T00:00:00+09:00',
      interviewMethod: '대면',
    }
    const values = {
      ...programToDetailEditValues(program),
      documentPassAnnouncementDate: undefined,
      documentPassAnnouncementMethod: undefined,
      interviewStartDate: undefined,
      interviewEndDate: undefined,
      interviewMethod: undefined,
    }
    const nested = volunteerDocumentInterviewNestedPatch(values, existing)
    expect(nested.documentPassAnnouncementDate).toBeUndefined()
    expect(nested.documentPassAnnouncementMethod).toBeUndefined()
    expect(nested.interviewStartDate).toBeUndefined()
    expect(nested.interviewEndDate).toBeUndefined()
    expect(nested.interviewMethod).toBeUndefined()
  })
})

describe('최종 합격자 발표 수정 저장 (강사·봉사자 공용 컬럼)', () => {
  const withRecruitLabels = {
    ...program,
    finalPassAnnouncementDate: '2026-10-05T00:00:00+09:00',
    finalPassAnnouncementMethod: '예전 방법',
    generalCommonInfo: {
      ...program.generalCommonInfo,
      instructorRecruitmentInfo: { finalAnnouncementLabel: '2026.10.01(목) | 강사 등록값' },
      volunteerRecruitmentInfo: {
        finalAnnouncementLabel: '2026.10.05(월) | 예전 방법',
        finalPassAnnouncementDate: '2026-10-05T00:00:00+09:00',
        finalPassAnnouncementMethod: '예전 방법',
      },
    },
  } as unknown as Program

  it('값을 바꾸면 봉사자 라벨·분리 필드도 갱신한다', () => {
    const values = {
      ...programToDetailEditValues(withRecruitLabels),
      finalPassAnnouncementDate: '2026-10-08T00:00:00+09:00',
      finalPassAnnouncementMethod: '새 방법',
    }
    const volunteer = detailEditValuesToProgramPatch(values, withRecruitLabels).generalCommonInfo
      ?.volunteerRecruitmentInfo as Record<string, unknown>
    expect(volunteer.finalAnnouncementLabel).toBe('2026.10.08(목) | 새 방법')
    expect(volunteer.finalPassAnnouncementMethod).toBe('새 방법')
  })

  it('값을 안 바꾸면 모집별 등록 라벨을 덮지 않는다', () => {
    const patch = detailEditValuesToProgramPatch(
      programToDetailEditValues(withRecruitLabels),
      withRecruitLabels
    )
    expect(patch.generalCommonInfo?.instructorRecruitmentInfo?.finalAnnouncementLabel).toBe(
      '2026.10.01(목) | 강사 등록값'
    )
  })
})

it('참여자 모집 상한 숫자를 비우면 existing 값으로 복원하지 않는다', () => {
  const withLimits = {
    ...program,
    generalCommonInfo: {
      ...program.generalCommonInfo,
      participantRecruitmentInfo: {
        maxAssignableInstructors: 3,
        maxClassCount: 2,
        maxScheduleCount: 4,
        maxSessionsPerDay: 5,
      },
    },
  } as Program
  const values = {
    ...programToDetailEditValues(withLimits),
    participantRecruitmentMaxInstructors: undefined,
    participantRecruitmentMaxClassCount: undefined,
    participantRecruitmentMaxScheduleCount: undefined,
    participantRecruitmentMaxSessionsPerDay: undefined,
  }
  const patch = detailEditValuesToProgramPatch(values, withLimits, {
    recruitmentAudience: 'participant',
  })
  const info = patch.generalCommonInfo?.participantRecruitmentInfo
  expect(info?.maxAssignableInstructors).toBeUndefined()
  expect(info?.maxClassCount).toBeUndefined()
  expect(info?.maxScheduleCount).toBeUndefined()
  expect(info?.maxSessionsPerDay).toBeUndefined()
})

it('참여자 모집 상한 숫자를 null로 비워도 existing 값으로 복원하지 않는다', () => {
  const withLimits = {
    ...program,
    generalCommonInfo: {
      ...program.generalCommonInfo,
      participantRecruitmentInfo: {
        maxAssignableInstructors: 3,
        maxClassCount: 2,
        maxScheduleCount: 4,
        maxSessionsPerDay: 5,
      },
    },
  } as Program
  const values = {
    ...programToDetailEditValues(withLimits),
    participantRecruitmentMaxInstructors: null,
    participantRecruitmentMaxClassCount: null,
    participantRecruitmentMaxScheduleCount: null,
    participantRecruitmentMaxSessionsPerDay: null,
  } as unknown as ReturnType<typeof programToDetailEditValues>
  const patch = detailEditValuesToProgramPatch(values, withLimits, {
    recruitmentAudience: 'participant',
  })
  const info = patch.generalCommonInfo?.participantRecruitmentInfo
  expect(info?.maxAssignableInstructors).toBeUndefined()
  expect(info?.maxClassCount).toBeUndefined()
  expect(info?.maxScheduleCount).toBeUndefined()
  expect(info?.maxSessionsPerDay).toBeUndefined()
})

it('강사 모집 저장 시 모집 인원·면접 일정을 비우면 existing으로 복원하지 않는다', () => {
  const withInstructor = {
    ...program,
    instructorCapacity: 12,
    interviewStartDate: '2026-09-10T00:00:00.000Z',
    interviewEndDate: '2026-09-12T00:00:00.000Z',
  } as Program
  const values = {
    ...programToDetailEditValues(withInstructor),
    instructorCapacity: undefined,
    interviewStartDate: undefined,
    interviewEndDate: undefined,
  }
  const patch = detailEditValuesToProgramPatch(values, withInstructor, {
    recruitmentAudience: 'instructor',
  })
  expect(patch.instructorCapacity).toBeUndefined()
  expect(patch.interviewStartDate).toBeUndefined()
  expect(patch.interviewEndDate).toBeUndefined()
})

describe('trained teachers recruitment edit round-trip', () => {
  const ttProgram = {
    ...program,
    id: '186005',
    generalParticipantTypes: ['school_institution'],
    generalProgramAudience: 'organization',
    studentListRequired: 'not_required',
    applicationStartDate: '2026-08-01T00:00:00.000Z',
    applicationEndDate: '2026-08-31T00:00:00.000Z',
    startDate: '2026-09-01T00:00:00.000Z',
    endDate: '2026-11-30T00:00:00.000Z',
    resultAnnouncementDate: '2026-08-31T00:00:00.000Z',
    resultAnnouncementMethod: '담당교사 개별 안내',
    contactPhone: '010-8681-6741',
    contactEmail: 'bjh1234@tinto.co.kr',
    targetLevels: ['elementary'],
    educationTargetDetail: '초등학교 5~6학년',
    remarks: 'TCH-05 로컬 데모',
    generalCommonInfo: {
      participantRecruitmentInfo: {
        announcementPublished: true,
        announcementPublishedLabel: '게시',
        studentListRequired: 'not_required',
        studentListRequiredLabel: '제출 불필요',
        maxAssignableInstructors: 0,
        maxClassCount: 1,
        maxScheduleCount: 3,
        maxSessionsPerDay: 8,
        operationPeriodLabel: '2026-09-01 ~ 2026-11-30',
        recruitmentPeriodLabel: '2026-08-01 ~ 2026-08-31',
        finalAnnouncementLabel: '2026-08-31 | 담당교사 개별 안내',
        educationTarget: '초등',
        educationTargetDetail: '초등학교 5~6학년',
        inquiryTel: '010-8681-6741',
        inquiryEmail: 'bjh1234@tinto.co.kr',
        remarks: 'TCH-05 로컬 데모',
      },
    },
  } as Program

  it('수정 가능한 모집 필드를 조회 SSOT(participantRecruitmentInfo)에 반영한다', async () => {
    const { resolveGeneralProgramParticipantRecruitmentDisplay } = await import(
      '@/features/program/general/lib/participant-recruitment-display'
    )
    const values = {
      ...programToDetailEditValues(ttProgram),
      participantRecruitmentAnnouncementPublished: 'unpublished' as const,
      studentListRequired: 'required' as const,
      participantRecruitmentMaxClassCount: 6,
      participantRecruitmentMaxScheduleCount: 5,
      participantRecruitmentMaxSessionsPerDay: 4,
      applicationStartDate: '2026-10-01T00:00:00.000Z',
      applicationEndDate: '2026-10-31T00:00:00.000Z',
      participantProgramOperationStartDate: '2026-11-01T00:00:00.000Z',
      participantProgramOperationEndDate: '2026-12-15T00:00:00.000Z',
      targetLevels: ['middle' as const],
      educationTargetDetail: '중학교 2학년',
      resultAnnouncementDate: '2026-11-02T00:00:00.000Z',
      resultAnnouncementMethod: '이메일 안내',
      contactPhone: '010-1111-2222',
      contactEmail: 'updated@tinto.co.kr',
      recruitmentContactOrganizationName: '수정문의처',
      remarks: '수정된 비고',
    }

    const patch = detailEditValuesToProgramPatch(values, ttProgram, {
      recruitmentAudience: 'participant',
    })
    expect(patch).not.toHaveProperty('featuredOnHome')
    expect(patch).not.toHaveProperty('homeDisplayOrder')
    const draft = {
      ...ttProgram,
      ...patch,
      generalCommonInfo: {
        ...ttProgram.generalCommonInfo,
        ...patch.generalCommonInfo,
      },
    } as Program

    const display = resolveGeneralProgramParticipantRecruitmentDisplay(draft)
    expect(display.announcementPublishedLabel).toBe('미게시')
    expect(display.studentListLabel).toBe('제출 필요')
    expect(display.maxClassLabel).toBe('6개')
    expect(display.maxScheduleCountLabel).toBe('5개')
    expect(display.maxSessionsPerDayLabel).toBe('4차시')
    expect(display.recruitmentPeriodLabel).toContain('2026.10.01')
    expect(display.operationPeriodLabel).toContain('2026.11.01')
    expect(display.targetLabel).toBe('중학교')
    expect(display.targetDetailLabel).toBe('중학교 2학년')
    expect(display.finalAnnouncementLabel).toContain('이메일 안내')
    expect(display.contactPhone).toBe('010-1111-2222')
    expect(display.contactEmail).toBe('updated@tinto.co.kr')
    expect(display.contactOrganizationName).toBe('수정문의처')
    expect(display.notes).toBe('수정된 비고')
    expect(draft.generalCommonInfo?.participantRecruitmentInfo?.maxAssignableInstructors).toBe(0)
  })
})

describe('detailEditValuesToProgramPatch — UJAT 설문 4종', () => {
  it('UJAT는 RHF의 분리된 설문 값을 저장하고 satisfaction으로 접지 않는다', () => {
    const existing = {
      ...program,
      backendProgramType: 'UJAT',
      generalSurveyMenuKeys: ['survey', 'satisfaction', 'lecture_evaluation'],
      ujatRegistrationOverlay: {
        'ujat.basicInfo.surveyItems': {
          survey: true,
          volunteer_satisfaction: true,
          school_satisfaction: false,
          lecture_evaluation: false,
        },
        'ujat.basicInfo.participant.organization': true,
        'ujat.basicInfo.participant.volunteer': false,
      },
    } as Program
    const values = {
      ...programToDetailEditValues(existing),
      surveySurvey: true,
      surveySatisfaction: true,
      surveyLectureEvaluation: true,
    }
    const patch = detailEditValuesToProgramPatch(values, existing)
    expect(patch.generalSurveyMenuKeys).toEqual([
      'survey',
      'volunteer_satisfaction',
      'lecture_evaluation',
    ])
    expect(patch.generalParticipantTypes).toEqual(['school_institution'])
  })

  it('일반 프로그램은 설문 3종 satisfaction을 유지한다', () => {
    const existing = {
      ...program,
      backendProgramType: 'GENERAL_ORGANIZATION',
      generalSurveyMenuKeys: ['survey', 'satisfaction'],
    } as Program
    const values = {
      ...programToDetailEditValues(existing),
      surveySurvey: true,
      surveySatisfaction: true,
      surveyLectureEvaluation: false,
    }
    const patch = detailEditValuesToProgramPatch(values, existing)
    expect(patch.generalSurveyMenuKeys).toEqual(['survey', 'satisfaction'])
  })
})
