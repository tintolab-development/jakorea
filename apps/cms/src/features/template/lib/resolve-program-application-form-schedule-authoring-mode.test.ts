import { describe, expect, it } from 'vitest'
import { resolveProgramApplicationFormScheduleIsTemplateAuthoringMode } from './resolve-program-application-form-schedule-authoring-mode'

describe('resolveProgramApplicationFormScheduleIsTemplateAuthoringMode', () => {
  it('등록 위저드 플레이스홀더 플래그가 있으면 programLinkedPreview여도 템플릿 모드', () => {
    expect(
      resolveProgramApplicationFormScheduleIsTemplateAuthoringMode({
        paragraphInteractionMode: 'authoring',
        programLinkedPreview: true,
        registrationWizardApplicationSchedulePlaceholder: true,
      })
    ).toBe(true)
  })

  it('프로그램 상세 연동 미리보기 — authoring에서 실슬롯 UI', () => {
    expect(
      resolveProgramApplicationFormScheduleIsTemplateAuthoringMode({
        paragraphInteractionMode: 'authoring',
        programLinkedPreview: true,
      })
    ).toBe(false)
  })

  it('템플릿 관리 authoring — 플레이스홀더', () => {
    expect(
      resolveProgramApplicationFormScheduleIsTemplateAuthoringMode({
        paragraphInteractionMode: 'authoring',
        programLinkedPreview: false,
      })
    ).toBe(true)
  })

  it('preview 모드 — 연동 슬롯', () => {
    expect(
      resolveProgramApplicationFormScheduleIsTemplateAuthoringMode({
        paragraphInteractionMode: 'preview',
        programLinkedPreview: true,
        registrationWizardApplicationSchedulePlaceholder: true,
      })
    ).toBe(true)
  })
})
