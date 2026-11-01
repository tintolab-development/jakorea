import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  parseGeneralProgramServiceDetailJson,
  serializeGeneralProgramServiceDetailJson,
} from './general-program-service-detail-json'
import { stripHiddenTypeSettingsFromRegistrationOverlay } from './type-settings-overlay-persist'

const SINGLE_FORM = 'generalRegistration.typeSettings.singleEducationForm'
const MULTI_FORM = 'generalRegistration.typeSettings.multiCommonEducationForm'
const SINGLE_PART = 'generalRegistration.typeSettings.singleParticipation'
const MULTI_PART = 'generalRegistration.typeSettings.multiCommonParticipation'
const FORM_BY_SESSION = 'generalRegistration.educationCurriculum.educationFormBySession'

function curriculumProgram(
  overlay: Record<string, unknown>,
  sessionRound: 'single' | 'multi'
): Program {
  return {
    id: 'p-radio-1',
    title: '라디오 저장',
    generalProgramAudience: 'individual',
    generalParticipantTypes: ['individual'],
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: sessionRound,
    generalCommonInfo: {
      educationFormLabel: overlay[SINGLE_FORM] === 'online' || overlay[MULTI_FORM] === 'online'
        ? '온라인'
        : '오프라인',
      educationFormScheduleDetail: 'common',
      participationScheduleDetail: 'common',
      curriculumSessions: [
        { sessionNo: 1, sessionLabel: '1차시', title: '단원1', description: '' },
      ],
    },
    registrationOverlay: overlay,
  } as unknown as Program
}

function persistedOverlay(program: Program): Record<string, unknown> {
  return (
    parseGeneralProgramServiceDetailJson(serializeGeneralProgramServiceDetailJson(program))
      .registrationOverlay ?? {}
  )
}

describe('stripHiddenTypeSettingsFromRegistrationOverlay', () => {
  it('단일 회차 저장 본문에서 stale multi 키를 빼고 입력 overlay는 그대로 둔다', () => {
    const overlay = {
      [SINGLE_FORM]: 'online',
      [MULTI_FORM]: 'offline',
      [SINGLE_PART]: 'individual',
      [MULTI_PART]: 'team',
    }
    const program = curriculumProgram(overlay, 'single')
    const stripped = stripHiddenTypeSettingsFromRegistrationOverlay(overlay, program) ?? {}
    expect(stripped[SINGLE_FORM]).toBe('online')
    expect(stripped).not.toHaveProperty(MULTI_FORM)
    expect(stripped).not.toHaveProperty(MULTI_PART)
    expect(overlay[MULTI_FORM]).toBe('offline')
  })

  it('serialize도 단일 회차 stale multi 키를 본문에서 뺀다', () => {
    const overlay = {
      [SINGLE_FORM]: 'online',
      [MULTI_FORM]: 'offline',
      [FORM_BY_SESSION]: { 1: 'offline' },
    }
    const formOverlay = { ...overlay }
    const saved = persistedOverlay(curriculumProgram(overlay, 'single'))
    expect(saved[SINGLE_FORM]).toBe('online')
    expect(saved).not.toHaveProperty(MULTI_FORM)
    expect(saved).not.toHaveProperty(FORM_BY_SESSION)
    expect(formOverlay[MULTI_FORM]).toBe('offline')
  })

  it('복수 회차 공통이면 single 키를 빼고 multi 키를 남긴다', () => {
    const overlay = {
      [SINGLE_FORM]: 'online',
      [MULTI_FORM]: 'offline',
    }
    const stripped =
      stripHiddenTypeSettingsFromRegistrationOverlay(
        overlay,
        curriculumProgram(overlay, 'multi')
      ) ?? {}
    expect(stripped[MULTI_FORM]).toBe('offline')
    expect(stripped).not.toHaveProperty(SINGLE_FORM)
  })
})
