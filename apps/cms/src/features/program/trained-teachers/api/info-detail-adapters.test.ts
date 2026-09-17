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
    expect(request.teacherTrainingScheduleName).toBe('교사 연수')
    expect(request.configJson).toContain('"educatedTeachers":3')
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

  it('prefers DTO flags over configJson when both present', () => {
    const patch = mapTrainedTeacherInfoDetailToProgramPatch({
      teacherTrainingEnabled: false,
      educationJournalEnabled: true,
      configJson: serializeTrainedTeacherInfoConfigJson({
        commonInfo: {
          teacherTrainingEnabled: true,
          educationJournalEnabled: false,
        },
      }),
    })
    expect(patch.generalCommonInfo?.teacherTrainingEnabled).toBe(false)
    expect(patch.generalCommonInfo?.educationJournalEnabled).toBe(true)
  })
})
