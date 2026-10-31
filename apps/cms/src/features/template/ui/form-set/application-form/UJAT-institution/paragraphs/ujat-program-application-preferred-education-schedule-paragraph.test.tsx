/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PREVIEW_PLACEHOLDER_SCHEDULE_HINT,
  PREVIEW_PLACEHOLDER_SCHEDULE_OPTIONS,
  UjatProgramApplicationPreferredEducationScheduleParagraph,
} from './ujat-program-application-preferred-education-schedule-paragraph'

vi.mock(
  '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-sync',
  () => ({
    UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS: { preferredScheduleSelectedIds: 'preferredScheduleSelectedIds' },
    useUjatApplicationInstitutionOverlayKv: () => [[], vi.fn()],
  })
)

vi.mock(
  '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync',
  () => ({
    getUjatProgramRegistrationOverlayRecord: () => ({}),
    getUjatProgramRegistrationOverlayVersion: () => 0,
    subscribeUjatProgramRegistrationOverlay: () => () => {},
  })
)

describe('UjatProgramApplicationPreferredEducationScheduleParagraph', () => {
  beforeEach(() => {
    cleanup()
  })

  it('shows placeholder schedule options and hint in user preview mode', () => {
    render(<UjatProgramApplicationPreferredEducationScheduleParagraph paragraphInteractionMode="user" />)

    expect(screen.getByText(PREVIEW_PLACEHOLDER_SCHEDULE_HINT)).toBeTruthy()
    for (const option of PREVIEW_PLACEHOLDER_SCHEDULE_OPTIONS) {
      expect(screen.getByText(option.display)).toBeTruthy()
    }
  })

  it('shows linked schedule guidance when programLinkedPreview has no overlay dates', () => {
    render(
      <UjatProgramApplicationPreferredEducationScheduleParagraph
        paragraphInteractionMode="user"
        programLinkedPreview
      />
    )

    expect(screen.queryByText(PREVIEW_PLACEHOLDER_SCHEDULE_HINT)).toBeNull()
    expect(
      screen.getByText('공통정보에서 교육 진행 일정을 먼저 선택해 주세요.')
    ).toBeTruthy()
  })
})
