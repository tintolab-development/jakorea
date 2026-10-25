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

  it('RHF KPI를 overlay에 쓰지 않는다', () => {
    syncUjatDetailEditFormKpiToOverlay({
      kpiFinalParticipants: 61,
      kpiVolunteerCount: 16,
      kpiFinalSchools: 3,
      kpiFinalClasses: 10,
    })
    const overlay = getUjatProgramRegistrationOverlayRecord()
    expect(overlay['ujat.kpi.participantCount']).toBeUndefined()
    expect(buildUjatKpiOverlayFromDetailEditForm({ kpiFinalParticipants: 61 })).toEqual({})
  })

  it('KPI overlay 키가 없으면 기존 Program.kpi를 유지한다', () => {
    const next = applyUjatRegistrationOverlayToProgram(baseProgram(), {})
    expect(next.generalCommonInfo?.kpi).toMatchObject({
      finalParticipants: 10,
      volunteerCount: 2,
      finalSchools: 1,
      finalClasses: 3,
    })
  })
})
