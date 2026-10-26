import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  enrichTrainedTeachersTypeSettingsFromApi,
  normalizeTrainedTeacherEducationFormFromApiType,
} from './resolve-type-settings-from-api'
import { resolveTrainedTeachersCanonicalCommonInfo } from './common-info-persist'
import {
  resolveStoredEducationFormLabel,
  resolveStoredIpsTypeSummary,
} from '@/features/program/shared/model/program-detail-edit-schema'
import { programToDetailEditValues } from '@/features/program/shared/model/program-detail-edit-schema'

function ttProgram(partial: Partial<Program>): Program {
  return {
    id: '186342',
    sponsorId: '1',
    title: 'TT',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    rounds: [],
    startDate: '2026-04-01',
    endDate: '2026-12-31',
    status: 'pending',
    backendProgramType: 'TRAINED_TEACHER',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

describe('normalizeTrainedTeacherEducationFormFromApiType', () => {
  it('maps API type strings to form values', () => {
    expect(normalizeTrainedTeacherEducationFormFromApiType('online')).toBe('online')
    expect(normalizeTrainedTeacherEducationFormFromApiType('offline')).toBe('offline')
    expect(normalizeTrainedTeacherEducationFormFromApiType('hybrid')).toBe('hybrid')
    expect(normalizeTrainedTeacherEducationFormFromApiType('participant_selection')).toBe(
      'participant_selection'
    )
  })

  it('returns undefined for unknown type', () => {
    expect(normalizeTrainedTeacherEducationFormFromApiType('live')).toBeUndefined()
  })
})

describe('enrichTrainedTeachersTypeSettingsFromApi', () => {
  it('186342 — top-level type·ips만 있을 때 label·summary 를 보강한다', () => {
    const program = ttProgram({
      type: 'offline',
      ips: 'Prepare',
      generalCommonInfo: {},
    })
    const patch = enrichTrainedTeachersTypeSettingsFromApi(program, {})
    expect(patch.educationFormLabel).toBe('오프라인')
    expect(patch.ipsTypeSummary).toBe('일정 공통 | Prepare | 해당없음')
    expect(patch.ipsScheduleDetail).toBe('common')
  })

  it('참여자 선택은 API type participant_selection 으로 온다', () => {
    const program = ttProgram({
      type: 'participant_selection' as Program['type'],
      ips: 'Prepare',
      generalCommonInfo: {},
    })
    const patch = enrichTrainedTeachersTypeSettingsFromApi(program, {})
    expect(patch.educationFormLabel).toBe('참여자 선택')
  })

  it('일정 별 상이 IPS — 행 summary 가 있으면 루트 summary 를 program.ips 로 덮지 않는다', () => {
    const program = ttProgram({
      type: 'offline',
      ips: 'Prepare',
      generalCommonInfo: {
        ipsScheduleDetail: 'perSchedule',
        curriculumSessions: [
          { sessionLabel: '1회차', title: 'a', description: '', ipsTypeSummary: 'Prepare | 해당없음' },
          {
            sessionLabel: '2회차',
            title: 'b',
            description: '',
            ipsTypeSummary: 'Succeed | Competition (대회+시상)',
          },
        ],
      },
    })
    const nested = program.generalCommonInfo!
    const patch = enrichTrainedTeachersTypeSettingsFromApi(program, nested)
    expect(patch.ipsTypeSummary).toBeUndefined()
    const canonical = resolveTrainedTeachersCanonicalCommonInfo(program)
    expect(resolveStoredIpsTypeSummary(canonical)).toBe('')
    expect(canonical.ipsScheduleDetail).toBe('perSchedule')
  })

  it('일정 별 상이 IPS — 행 summary 가 모두 같으면 루트 표시에 그 문구를 쓴다', () => {
    const program = ttProgram({
      type: 'offline',
      ips: 'Prepare',
      generalCommonInfo: {
        ipsScheduleDetail: 'perSchedule',
        curriculumSessions: [
          { sessionLabel: '1회차', title: 'a', description: '', ipsTypeSummary: 'Prepare | 해당없음' },
          { sessionLabel: '2회차', title: 'b', description: '', ipsTypeSummary: 'Prepare | 해당없음' },
        ],
      },
    })
    const canonical = resolveTrainedTeachersCanonicalCommonInfo(program)
    expect(resolveStoredIpsTypeSummary(canonical)).toBe('Prepare | 해당없음')
  })

  it('stored label·summary 가 있으면 API 값으로 덮지 않는다', () => {
    const program = ttProgram({
      type: 'online',
      ips: 'Succeed',
      generalCommonInfo: {
        educationFormLabel: '오프라인',
        ipsTypeSummary: '일정 공통 | Inspire | 학교',
        ipsScheduleDetail: 'common',
      },
    })
    const patch = enrichTrainedTeachersTypeSettingsFromApi(program, program.generalCommonInfo!)
    expect(patch.educationFormLabel).toBeUndefined()
    expect(patch.ipsTypeSummary).toBeUndefined()
  })
})

describe('resolveTrainedTeachersCanonicalCommonInfo + programToDetailEditValues (TT)', () => {
  it('상세 표시·수정 시드에 교육 형태가 채워진다', () => {
    const program = ttProgram({
      type: 'offline',
      ips: 'Prepare',
      generalCommonInfo: {},
    })
    const canonical = resolveTrainedTeachersCanonicalCommonInfo(program)
    expect(resolveStoredEducationFormLabel(canonical)).toBe('오프라인')
    expect(resolveStoredIpsTypeSummary(canonical)).toBe('일정 공통 | Prepare | 해당없음')

    const values = programToDetailEditValues(program)
    expect(values.educationForm).toBe('offline')
  })

  it('교육 과정 API 코드가 수정 폼 시드·표시 라벨과 맞는다', () => {
    const program = ttProgram({
      educationProcess: 'digital_computer',
      generalCommonInfo: {},
    })
    const values = programToDetailEditValues(program)
    expect(values.educationProcess).toBe('digital_computer')
  })
})
