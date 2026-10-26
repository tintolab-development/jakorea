import { beforeEach, describe, expect, it } from 'vitest'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  buildUjatRecruitTemplateSettingsJson,
  clearUjatRecruitTemplateTypedState,
  hydrateUjatRecruitTemplateTypedStateFromSettings,
  patchUjatRecruitTemplateFormValues,
  setUjatRecruitTemplateTypedState,
} from './ujat-recruit-template-typed-state'

describe('UJAT recruit template typed state', () => {
  beforeEach(() => clearUjatRecruitTemplateTypedState())

  it('keeps institution and H1/H2 volunteer authoring state in settingsJson', () => {
    setUjatRecruitTemplateTypedState('recruitment-ujat-volunteer', {
      volunteerH1: { description: 'H1 description' },
      volunteerH2: { description: 'H2 description' },
      interviewH1: { schemaVersion: 1, selectedSlotKeys: ['1-2'] },
    })

    const settings = buildUjatRecruitTemplateSettingsJson('recruitment-ujat-volunteer')

    expect(settings).toEqual({
      ujatRecruitment: {
        volunteerH1: { description: 'H1 description' },
        volunteerH2: { description: 'H2 description' },
        interviewH1: { schemaVersion: 1, selectedSlotKeys: ['1-2'] },
      },
    })
    expect(settings).not.toHaveProperty('overlay')
  })

  it('patches nested RHF fields without dropping the other typed fields', () => {
    setUjatRecruitTemplateTypedState('recruitment-ujat-school', {
      institution: {
        description: 'description',
        rounds: [{ curriculum: '기존' }],
      } as Partial<ProgramDetailEditFormValues>,
    })

    patchUjatRecruitTemplateFormValues({
      templateCode: 'recruitment-ujat-school',
      kind: 'institution',
      fieldName: 'rounds.0.curriculum',
      value: '수정',
    })

    expect(buildUjatRecruitTemplateSettingsJson('recruitment-ujat-school')).toEqual({
      ujatRecruitment: {
        institution: { description: 'description', rounds: [{ curriculum: '수정' }] },
      },
    })
  })

  it('hydrates settingsJson without creating an extension overlay payload', () => {
    hydrateUjatRecruitTemplateTypedStateFromSettings({
      templateCode: 'recruitment-ujat-school',
      settingsJson: {
        ujatRecruitment: {
          institution: { description: 'from GET' },
        },
      },
    })

    expect(buildUjatRecruitTemplateSettingsJson('recruitment-ujat-school')).toEqual({
      ujatRecruitment: {
        institution: { description: 'from GET' },
      },
    })
  })
})
