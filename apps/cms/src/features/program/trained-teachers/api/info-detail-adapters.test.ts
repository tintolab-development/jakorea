import { describe, expect, it } from 'vitest'
import {
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
    expect(parseTrainedTeacherInfoConfigJson(raw)).toEqual({
      educatedTeachers: 12,
      generalCommonInfo: payload.commonInfo,
    })
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
    expect(request.configJson).toContain('"educatedTeachers":3')
  })

  it('does not copy sponsor or textbook fields into a narrow info-detail PATCH', () => {
    const request = mapTrainedTeacherInfoSaveToRequest({
      commonInfo: {
        teacherTrainingEnabled: false,
        educationJournalEnabled: true,
        curriculumSessions: [{ sessionLabel: '1차시', title: '신 차시', description: '' }],
      },
    })
    expect(request.configJson).not.toContain('sponsorManagementIds')
    expect(request.configJson).not.toContain('textbookName')
    expect(request.configJson).not.toContain('detailedProgramName')
    expect(request.configJson).toContain('"title":"신 차시"')
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
    } as Program
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

  it('prefers detail configJson curriculum over stale programs nested copy', () => {
    const program = {
      id: '186034',
      title: 't',
      generalCommonInfo: {
        curriculumSessions: [{ sessionLabel: '1차시', title: '구 차시', description: '' }],
        scheduleDetails: [{ scheduleLabel: '세부 일정 01', name: '구 일정' }],
      },
    } as Program
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
})
