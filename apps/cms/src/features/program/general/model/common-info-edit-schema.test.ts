import { describe, expect, it } from 'vitest'
import { getGeneralProgramById } from '@/data/mock/general-programs'
import {
  generalProgramCommonInfoEditSchema,
  generalCommonInfoEditValuesToProgramPatch,
  programToGeneralCommonInfoEditValues,
} from './common-info-edit-schema'

describe('generalCommonInfoEditSchema', () => {
  it('mock 예정 프로그램 기본값이 저장 검증을 통과한다', () => {
    const program = getGeneralProgramById('general-prog-scheduled-1')
    expect(program).toBeDefined()
    const values = programToGeneralCommonInfoEditValues(program!)
    expect(values.sponsorManagementIds.length).toBeGreaterThan(0)
    expect(values.sponsorManagerContactId).not.toBe('')
    expect(values.educationProcess).not.toBe('')
    expect(values.ipOwned).not.toBe('')
    expect(values.courseDeliveredBy).not.toBe('')
    const parsed = generalProgramCommonInfoEditSchema.safeParse(values)
    expect(parsed.success).toBe(true)
  })

  it('참여 방식(팀) 저장 후 다시 로드하면 팀으로 유지된다', () => {
    const program = getGeneralProgramById('general-prog-scheduled-1')
    expect(program).toBeDefined()
    const values = programToGeneralCommonInfoEditValues(program!)
    values.participationMethod = 'team'
    const patch = generalCommonInfoEditValuesToProgramPatch(values, program!)
    expect(patch.generalCommonInfo?.participationMethod).toBe('team')

    const merged: typeof program = {
      ...program!,
      ...patch,
      generalCommonInfo: {
        ...program!.generalCommonInfo,
        ...patch.generalCommonInfo,
      },
    }
    const reloaded = programToGeneralCommonInfoEditValues(merged)
    expect(reloaded.participationMethod).toBe('team')
  })
})
