import { beforeEach, describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  getUjatProgramRegistrationOverlayRecord,
  resetUjatProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import { applyUjatRegistrationOverlayToProgram } from './ujat-registration-basic-info-display'
import {
  buildUjatKpiOverlayFromDetailEditForm,
  syncUjatDetailEditFormKpiToOverlay,
} from './detail-edit-form-kpi-to-overlay'

function baseProgram(): Program {
  return {
    id: 'ujat-1',
    sponsorId: 'sponsor-1',
    title: 'UJAT',
    type: 'offline',
    format: 'course',
    category: 'school',
    rounds: [],
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-12-31T23:59:59.999Z',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    generalCommonInfo: {
      kpi: {
        finalParticipants: 10,
        instructorCount: 0,
        volunteerCount: 2,
        finalSchools: 1,
        finalClasses: 3,
      },
    },
  }
}

describe('syncUjatDetailEditFormKpiToOverlay', () => {
  beforeEach(() => {
    resetUjatProgramRegistrationOverlay()
  })

  it('RHF KPI를 overlay 키로 옮긴다', () => {
    syncUjatDetailEditFormKpiToOverlay({
      kpiFinalParticipants: 61,
      kpiVolunteerCount: 16,
      kpiFinalSchools: 3,
      kpiFinalClasses: 10,
    })
    const overlay = getUjatProgramRegistrationOverlayRecord()
    expect(overlay['ujat.kpi.participantCount']).toBe(61)
    expect(overlay['ujat.kpi.volunteer']).toBe(16)
    expect(overlay['ujat.kpi.dispatchedSchool']).toBe(3)
    expect(overlay['ujat.kpi.dispatchedClass']).toBe(10)
  })

  it('overlay KPI가 apply 후 Program.kpi에 반영된다', () => {
    const overlay = {
      ...buildUjatKpiOverlayFromDetailEditForm({
        kpiFinalParticipants: 40,
        kpiVolunteerCount: 8,
        kpiFinalSchools: 4,
        kpiFinalClasses: 12,
      }),
    }
    const next = applyUjatRegistrationOverlayToProgram(baseProgram(), overlay)
    expect(next.generalCommonInfo?.kpi?.finalParticipants).toBe(40)
    expect(next.generalCommonInfo?.kpi?.volunteerCount).toBe(8)
    expect(next.generalCommonInfo?.kpi?.finalSchools).toBe(4)
    expect(next.generalCommonInfo?.kpi?.finalClasses).toBe(12)
  })
})
