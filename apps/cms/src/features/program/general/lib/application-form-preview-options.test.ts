import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@/features/template/model/program-application-form-individual-draft'
import { buildGeneralApplicationFormPreviewParagraphBodyOptions } from './application-form-preview-options'
import { resolveInstitutionApplicationProgramBridge } from './institution-application-program-bridge'

const emptyVm = {
  structureLockedParagraphIds: undefined,
  programApplicationFormInstructorOptions: { enabled: false as const },
  programApplicationFormVolunteerOptions: {
    enabled: false as const,
    exceptionScheduleCount: 0,
    exceptionScheduleAddDisabled: false,
    onAddExceptionSchedule: () => {},
    onCommonExclusionChange: undefined,
  },
}

describe('buildGeneralApplicationFormPreviewParagraphBodyOptions', () => {
  it('프로그램 상세 연동 미리보기는 공통정보 일정을 쓰고 schema 객관식 snapshot을 쓰지 않는다', () => {
    const program = {
      id: 'detail-preview-schedule',
      generalProgramAudience: 'individual',
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'single',
      generalCommonInfo: {
        educationScheduleMode: 'date',
        educationScheduleLines: [
          '26년 9월 1일(화) 9:00 ~ 12:00',
          '26년 9월 8일(화) 13:00 ~ 16:00',
        ],
      },
    } as Program
    const institutionBridge = resolveInstitutionApplicationProgramBridge(program)

    const options = buildGeneralApplicationFormPreviewParagraphBodyOptions(
      'individual',
      emptyVm,
      {
        program,
        paragraphs: [],
        institutionBridge,
        programLinkedApplicationFormPreview: true,
      }
    )

    expect(options.applicationFormSchemaSnapshotPreview).toBeUndefined()
    expect(options.programLinkedIndividualApplicationForm).toBe(true)
    expect(options.institutionApplicationProgramBridge?.educationScheduleLines).toEqual([
      '26년 9월 1일(화) 9:00 ~ 12:00',
      '26년 9월 8일(화) 13:00 ~ 16:00',
    ])
    expect(institutionBridge.educationScheduleLines).toEqual([
      '26년 9월 1일(화) 9:00 ~ 12:00',
      '26년 9월 8일(화) 13:00 ~ 16:00',
    ])
    expect(options.hiddenParagraphIds?.has(PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice)).toBe(
      false
    )
  })

  it('schema snapshot 플래그가 켜지면 일정 연동 UI를 끈다', () => {
    const options = buildGeneralApplicationFormPreviewParagraphBodyOptions(
      'individual',
      emptyVm,
      {
        paragraphs: [],
        programLinkedApplicationFormPreview: true,
        applicationFormPublishedSchemaSnapshotPreview: true,
      }
    )

    expect(options.applicationFormSchemaSnapshotPreview).toBe(true)
    expect(options.programLinkedIndividualApplicationForm).toBe(false)
  })
})
