import { describe, expect, it } from 'vitest'
import {
  applyTrainedTeacherInfoDetailSaveToCache,
  mapTrainedTeacherInfoDetailToProgramPatch,
  mapTrainedTeacherInfoSaveToRequest,
  mergeTrainedTeacherInfoDetailIntoProgram,
  parseTrainedTeacherInfoConfigJson,
  serializeTrainedTeacherInfoConfigJson,
} from './info-detail-adapters'
import type { Program } from '@/types/domain'

describe('trained-teacher info detail adapters', () => {
  it('round-trips configJson common info', () => {
    const payload = {
      educatedTeachers: 12,
      commonInfo: {
        teacherTrainingEnabled: true,
        educationJournalEnabled: true,
        kpi: {
          finalParticipants: 100,
          instructorCount: 0,
          volunteerCount: 0,
          finalSchools: 5,
          finalClasses: 10,
        },
      },
    }
    const raw = serializeTrainedTeacherInfoConfigJson(payload)
    expect(raw).not.toContain('educatedTeachers')
    expect(raw).not.toContain('finalParticipants')
    expect(parseTrainedTeacherInfoConfigJson(raw).generalCommonInfo).toMatchObject({
      educationJournalEnabled: true,
      teacherTrainingEnabled: true,
      teacherTrainingScheduleName: '교육 연수',
    })
    expect(parseTrainedTeacherInfoConfigJson(raw).generalCommonInfo).not.toHaveProperty('kpi')
  })

  it('maps save payload to PATCH request flags + configJson', () => {
    const request = mapTrainedTeacherInfoSaveToRequest({
      educatedTeachers: 3,
      commonInfo: {
        teacherTrainingEnabled: true,
        educationJournalEnabled: false,
      },
    })
    expect(request.teacherTrainingEnabled).toBe(true)
    expect(request.educationJournalEnabled).toBe(false)
    expect(request.educationJournalRequired).toBe(false)
    expect(request.journalSubmissionLimitType).toBe('UNLIMITED')
    expect(request.teacherTrainingScheduleName).toBe('교육 연수')
    expect(request.configJson).not.toContain('educatedTeachers')
    expect(request.configJson).toContain('"teacherTrainingScheduleName":"교육 연수"')
  })

  it('sends schedule name and time only, and omits announcement, sponsors, and kpi', () => {
    const request = mapTrainedTeacherInfoSaveToRequest({
      educatedTeachers: 9,
      commonInfo: {
        teacherTrainingEnabled: false,
        educationJournalEnabled: true,
        announcementTitle: '교육받은교사(수정2)',
        detailedProgramName: '사회공헌 프로젝트2',
        sponsorManagementIds: ['163302'],
        title: '구제목',
        textbookName: '교재 마스터',
        sponsorId: '163302',
        kpi: {
          finalParticipants: 1,
          instructorCount: 0,
          volunteerCount: 0,
          finalSchools: 1,
          finalClasses: 1,
        },
        scheduleDetails: [
          {
            scheduleLabel: '세부 일정 01',
            name: '교육받은교사(수정3)',
            progressTimeSummary: '15:43 ~ 16:43',
          },
        ],
      } as NonNullable<Program['generalCommonInfo']>,
    })
    expect(request.configJson).not.toContain('announcementTitle')
    expect(request.configJson).not.toContain('sponsorManagementIds')
    expect(request.configJson).not.toContain('detailedProgramName')
    expect(request.configJson).not.toContain('finalParticipants')
    expect(request.configJson).toContain('교육받은교사(수정3)')
    expect(request.configJson).toContain('15:43 ~ 16:43')
    expect(request.configJson).not.toContain('교재 마스터')
    expect(request.configJson).not.toContain('"title":"구제목"')
    expect(request.configJson).not.toContain('educatedTeachers')
    expect(request.configJson).toContain('"teacherTrainingScheduleName":""')
  })

  it('reads educationScheduleRange from configJson root', () => {
    const patch = mapTrainedTeacherInfoDetailToProgramPatch({
      teacherTrainingEnabled: true,
      configJson: JSON.stringify({
        schemaVersion: 1,
        educationScheduleMode: 'period',
        educationScheduleRange: {
          start: '2026-04-01T00:00:00.000Z',
          end: '2026-11-30T00:00:00.000Z',
        },
      }),
    })
    expect(patch.generalCommonInfo?.educationScheduleMode).toBe('period')
    expect(patch.generalCommonInfo?.educationScheduleRange).toEqual({
      start: '2026-04-01T00:00:00.000Z',
      end: '2026-11-30T00:00:00.000Z',
    })
  })

  it('configJson null range는 기존 program range를 덮어 지운다', () => {
    const program = {
      id: '1',
      title: 't',
      generalCommonInfo: {
        educationScheduleMode: 'period',
        educationScheduleRange: {
          start: '2026-04-01T00:00:00.000Z',
          end: '2026-11-30T00:00:00.000Z',
        },
      },
    } as unknown as Program
    const merged = mergeTrainedTeacherInfoDetailIntoProgram(program, {
      teacherTrainingEnabled: false,
      educationJournalEnabled: false,
      configJson: JSON.stringify({
        schemaVersion: 1,
        generalCommonInfo: {
          educationScheduleMode: 'date',
          educationScheduleLines: ['2026.11.11(수) 10:00 ~ 12:00'],
          educationScheduleRange: null,
        },
      }),
    })
    expect(merged.generalCommonInfo?.educationScheduleMode).toBe('date')
    expect(merged.generalCommonInfo?.educationScheduleRange).toBeNull()
  })

  it('merges GET detail into program without wiping programs KPI', () => {
    const program = {
      id: '1',
      title: 't',
      totalParticipants: 100,
      educatedTeachers: 12,
      generalCommonInfo: {
        educationJournalEnabled: false,
        kpi: {
          finalParticipants: 100,
          instructorCount: 0,
          volunteerCount: 0,
          finalSchools: 8,
          finalClasses: 12,
        },
      },
    } as unknown as Program
    const merged = mergeTrainedTeacherInfoDetailIntoProgram(program, {
      teacherTrainingEnabled: true,
      educationJournalEnabled: true,
      configJson: serializeTrainedTeacherInfoConfigJson({
        educatedTeachers: 7,
        commonInfo: {
          kpi: {
            finalParticipants: 1,
            instructorCount: 0,
            volunteerCount: 0,
            finalSchools: 1,
            finalClasses: 1,
          },
        },
      }),
    })
    // programs PATCH SSOT — configJson 옛 kpi 로 덮지 않음
    expect(merged.educatedTeachers).toBe(12)
    expect(merged.totalParticipants).toBe(100)
    expect(merged.generalCommonInfo?.teacherTrainingEnabled).toBe(true)
    expect(merged.generalCommonInfo?.educationJournalEnabled).toBe(true)
    expect(merged.generalCommonInfo?.kpi?.finalParticipants).toBe(100)
    expect(merged.generalCommonInfo?.kpi?.finalSchools).toBe(8)
  })

  it('typed와 configJson educationJournalEnabled가 다르면 경고를 남기고 typed를 표시 정본으로 쓴다', () => {
    const merged = mergeTrainedTeacherInfoDetailIntoProgram(
      {
        id: '186340',
        title: 't',
        generalCommonInfo: { educationJournalEnabled: true },
      } as Program,
      {
        teacherTrainingEnabled: false,
        educationJournalEnabled: true,
        educationJournalRequired: false,
        journalSubmissionLimitType: 'UNLIMITED',
        configJson: JSON.stringify({
          schemaVersion: 1,
          generalCommonInfo: { educationJournalEnabled: false },
        }),
      }
    )
    expect(merged.generalCommonInfo?.educationJournalEnabled).toBe(true)
    expect(merged.trainedTeacherInfoDetailWarnings).toEqual([
      'educationJournalEnabled typed/configJson mismatch',
    ])
  })

  it('typed educationJournalEnabled를 A nested보다 우선하고 "false" 문자열을 true로 보지 않는다', () => {
    const program = {
      id: '186034',
      title: 't',
      generalCommonInfo: { educationJournalEnabled: true },
    } as Program
    const mergedFalse = mergeTrainedTeacherInfoDetailIntoProgram(program, {
      teacherTrainingEnabled: false,
      educationJournalEnabled: false,
      configJson: JSON.stringify({
        schemaVersion: 1,
        generalCommonInfo: { educationJournalEnabled: true },
      }),
    })
    expect(mergedFalse.generalCommonInfo?.educationJournalEnabled).toBe(false)

    const mergedTypedMissing = mergeTrainedTeacherInfoDetailIntoProgram(program, {
      teacherTrainingEnabled: false,
      configJson: JSON.stringify({
        schemaVersion: 1,
        generalCommonInfo: { educationJournalEnabled: false },
      }),
    })
    expect(mergedTypedMissing.generalCommonInfo?.educationJournalEnabled).toBe(false)

    const fromFalseString = mapTrainedTeacherInfoDetailToProgramPatch({
      educationJournalEnabled: 'false' as unknown as boolean,
      configJson: JSON.stringify({
        schemaVersion: 1,
        generalCommonInfo: { educationJournalEnabled: true },
      }),
    })
    expect(fromFalseString.generalCommonInfo?.educationJournalEnabled).toBe(false)
  })

  it('prefers detail configJson curriculum over stale programs nested copy', () => {
    const program = {
      id: '186034',
      title: 't',
      generalCommonInfo: {
        curriculumSessions: [{ sessionLabel: '1차시', title: '구 차시', description: '' }],
        scheduleDetails: [{ scheduleLabel: '세부 일정 01', name: '구 일정' }],
      },
    } as unknown as Program
    const merged = mergeTrainedTeacherInfoDetailIntoProgram(program, {
      teacherTrainingEnabled: false,
      educationJournalEnabled: false,
      configJson: serializeTrainedTeacherInfoConfigJson({
        commonInfo: {
          curriculumSessions: [{ sessionLabel: '1차시', title: '신 차시', description: '새 내용' }],
          scheduleDetails: [{ scheduleLabel: '세부 일정 01', name: '신 일정' }],
        },
      }),
    })
    expect(merged.generalCommonInfo?.curriculumSessions).toEqual([
      { sessionLabel: '1차시', title: '신 차시', description: '새 내용' },
    ])
    expect(merged.generalCommonInfo?.scheduleDetails).toEqual([
      { scheduleLabel: '세부 일정 01', name: '신 일정' },
    ])
  })

  it('detail config가 있으면 커리큘럼·일정은 detail GET을 쓴다', () => {
    const program = {
      id: '186034',
      title: 't',
      generalCommonInfo: {
        curriculumSessions: [{ sessionLabel: '1차시', title: 'A 최신 차시', description: '' }],
        scheduleDetails: [{ scheduleLabel: '세부 일정 01', name: 'A 최신 일정' }],
      },
    } as Program
    const merged = mergeTrainedTeacherInfoDetailIntoProgram(program, {
      teacherTrainingEnabled: false,
      educationJournalEnabled: false,
      configJson: serializeTrainedTeacherInfoConfigJson({
        commonInfo: {
          curriculumSessions: [{ sessionLabel: '1차시', title: 'B 구 차시', description: '' }],
          scheduleDetails: [{ scheduleLabel: '세부 일정 01', name: 'B 구 일정' }],
        },
      }),
    })
    expect(merged.generalCommonInfo?.curriculumSessions?.[0]?.title).toBe('B 구 차시')
    expect(merged.generalCommonInfo?.scheduleDetails?.[0]?.name).toBe('B 구 일정')
  })

  it('prefers program.generalCommonInfo over stale root copy in configJson', () => {
    const parsed = parseTrainedTeacherInfoConfigJson(
      JSON.stringify({
        schemaVersion: 1,
        generalCommonInfo: {
          sponsorManagementIds: ['1627251'],
          sponsorManagerContactIds: ['1627251::1627253'],
          detailedProgramName: '구값',
        },
        program: {
          generalCommonInfo: {
            sponsorManagementIds: ['163302'],
            sponsorManagerContactIds: ['163302::163323'],
            detailedProgramName: '사회공헌 프로젝트',
          },
        },
      })
    )
    expect(parsed.generalCommonInfo?.sponsorManagementIds).toEqual(['163302'])
    expect(parsed.generalCommonInfo?.sponsorManagerContactIds).toEqual(['163302::163323'])
    expect(parsed.generalCommonInfo?.detailedProgramName).toBe('사회공헌 프로젝트')
  })

  it('keeps programs GET sponsor ids when merging stale configJson root', () => {
    const program = {
      id: '186034',
      title: 't',
      sponsorId: '163302',
      generalCommonInfo: {
        sponsorManagementIds: ['163302'],
        sponsorManagerContactIds: ['163302::163323'],
        detailedProgramName: '사회공헌 프로젝트',
      },
    } as Program
    const merged = mergeTrainedTeacherInfoDetailIntoProgram(program, {
      teacherTrainingEnabled: false,
      educationJournalEnabled: false,
      configJson: JSON.stringify({
        schemaVersion: 1,
        generalCommonInfo: {
          sponsorManagementIds: ['1627251'],
          sponsorManagerContactIds: ['1627251::1627253'],
          detailedProgramName: '구값',
        },
      }),
    })
    expect(merged.generalCommonInfo?.sponsorManagementIds).toEqual(['163302'])
    expect(merged.generalCommonInfo?.sponsorManagerContactIds).toEqual(['163302::163323'])
    expect(merged.generalCommonInfo?.detailedProgramName).toBe('사회공헌 프로젝트')
  })

  it('sends empty teacherTrainingScheduleName when training is off', () => {
    const request = mapTrainedTeacherInfoSaveToRequest({
      commonInfo: {
        teacherTrainingEnabled: false,
        educationJournalEnabled: false,
      },
    })
    expect(request.teacherTrainingEnabled).toBe(false)
    expect(request.teacherTrainingScheduleName).toBe('')
  })

  it('keeps progress time when detail JSON omits it but programs JSON has it', () => {
    const program = {
      id: '186034',
      title: '교육받은교사(수정4)',
      generalCommonInfo: {
        announcementTitle: '교육받은교사(수정4)',
        scheduleDetails: [
          {
            scheduleLabel: '세부 일정 01',
            name: '구 일정명',
            progressTimeSummary: '15:43 ~ 16:43',
          },
        ],
      },
    } as Program
    const merged = mergeTrainedTeacherInfoDetailIntoProgram(program, {
      teacherTrainingEnabled: false,
      educationJournalEnabled: false,
      teacherTrainingScheduleName: '',
      configJson: JSON.stringify({
        schemaVersion: 1,
        generalCommonInfo: {
          scheduleDetails: [{ scheduleLabel: '세부 일정 01', name: '교육받은교사(수정3)' }],
        },
      }),
    })
    expect(merged.generalCommonInfo?.scheduleDetails?.[0]).toMatchObject({
      name: '교육받은교사(수정3)',
    })
    expect(merged.generalCommonInfo?.scheduleDetails?.[0]?.progressTimeSummary).toBeUndefined()
    expect(merged.generalCommonInfo?.announcementTitle).toBe('교육받은교사(수정4)')
  })

  it('keeps participantRecruitmentInfo when GET detail omits it', () => {
    const program = {
      id: '186005',
      title: 'TT',
      remarks: '모집 비고 신값',
      generalCommonInfo: {
        announcementTitle: 'TT',
        participantRecruitmentInfo: {
          remarks: '모집 비고 신값',
          educationTargetDetail: '초등학교 5~6학년',
          contactOrganizationName: '수정문의처',
          maxClassCount: 4,
        },
      },
    } as Program
    const merged = mergeTrainedTeacherInfoDetailIntoProgram(program, {
      teacherTrainingEnabled: false,
      educationJournalEnabled: false,
      configJson: JSON.stringify({
        schemaVersion: 1,
        generalCommonInfo: {
          teacherTrainingEnabled: false,
          educationJournalEnabled: false,
        },
      }),
    })
    expect(merged.generalCommonInfo?.participantRecruitmentInfo).toMatchObject({
      remarks: '모집 비고 신값',
      educationTargetDetail: '초등학교 5~6학년',
      contactOrganizationName: '수정문의처',
      maxClassCount: 4,
    })
    expect(merged.remarks).toBe('모집 비고 신값')
  })

  it('clears leftover 교육 연수 when GET schedule name is empty', () => {
    const patch = mapTrainedTeacherInfoDetailToProgramPatch({
      teacherTrainingEnabled: false,
      teacherTrainingScheduleName: '',
      configJson: JSON.stringify({
        schemaVersion: 1,
        generalCommonInfo: {
          teacherTrainingEnabled: false,
          teacherTrainingScheduleName: '교육 연수',
          scheduleDetails: [{ scheduleLabel: '행사 일정 01', name: '교육 연수' }],
        },
      }),
    })
    expect(patch.generalCommonInfo?.teacherTrainingEnabled).toBe(false)
    expect(patch.generalCommonInfo?.teacherTrainingScheduleName).toBe('')
    expect(patch.generalCommonInfo?.scheduleDetails?.[0]?.name).toBe('')
  })

  it('저장 직후 캐시는 서버 GET 응답을 그대로 사용한다', () => {
    const cached = {
      id: '186018',
      title: '수정3',
      businessArea: '디지털리터러시',
      generalSurveyMenuKeys: ['teacher'],
      generalCommonInfo: {
        venueKind: 'inside',
        venueDetail: '서울시 강서구 가양 데시앙플렉스',
        announcementTitle: '수정3',
        kpi: {
          finalParticipants: 10,
          instructorCount: 0,
          volunteerCount: 0,
          finalSchools: 1,
          finalClasses: 2,
        },
        curriculumSessions: [{ sessionLabel: '1차시', title: 'A캐시 차시' }],
      },
    } as unknown as Program
    const detailGet = {
      id: '186018',
      title: '구 제목',
      businessArea: '경제금융',
      generalSurveyMenuKeys: ['survey'],
      generalCommonInfo: {
        venueKind: 'outside',
        venueDetail: '구 장소',
        educationJournalEnabled: true,
        curriculumSessions: [{ sessionLabel: '1차시', title: '서버 차시' }],
      },
    } as Program

    const next = applyTrainedTeacherInfoDetailSaveToCache(cached, detailGet, '186018', {
      venueKind: 'inside',
      venueDetail: '서울시 강서구 가양 데시앙플렉스',
      curriculumSessions: [{ sessionLabel: '1차시', title: 'FE만 차시', description: '' }],
    })

    expect(next.id).toBe('186018')
    expect(next.title).toBe('구 제목')
    expect(next.businessArea).toBe('경제금융')
    expect(next.generalSurveyMenuKeys).toEqual(['survey'])
    expect(next.generalCommonInfo?.venueDetail).toBe('구 장소')
    expect(next.generalCommonInfo?.venueKind).toBe('outside')
    expect(next.generalCommonInfo?.curriculumSessions?.[0]?.title).toBe('서버 차시')
    expect(next.generalCommonInfo?.educationJournalEnabled).toBe(true)
  })

  it('B configJson 이 nested 배열을 생략하면 A nested 를 지우지 않는다', () => {
    const program = {
      id: '186312',
      title: 't',
      generalCommonInfo: {
        curriculumSessions: [
          { sessionLabel: '1회차', title: 'A 2회차 중 1', description: 'a' },
          { sessionLabel: '2회차', title: 'A 2회차 중 2', description: 'b' },
        ],
        educationScheduleLines: ['2026.10.29 ~ 2026.10.31'],
        educationScheduleMode: 'period',
      },
    } as Program
    const merged = mergeTrainedTeacherInfoDetailIntoProgram(program, {
      teacherTrainingEnabled: true,
      educationJournalEnabled: false,
      configJson: JSON.stringify({
        schemaVersion: 1,
        generalCommonInfo: {
          teacherTrainingEnabled: true,
          educationJournalEnabled: false,
        },
      }),
    })
    expect(merged.generalCommonInfo?.curriculumSessions).toHaveLength(2)
    expect(merged.generalCommonInfo?.educationScheduleLines).toEqual([
      '2026.10.29 ~ 2026.10.31',
    ])
    expect(merged.generalCommonInfo?.educationScheduleMode).toBe('period')
  })
})
