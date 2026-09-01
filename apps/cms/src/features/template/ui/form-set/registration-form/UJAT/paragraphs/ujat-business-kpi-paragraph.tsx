/**
 * UJAT 프로그램 등록 폼 — 사업 KPI 목표 (강사 비활성, 봉사자는 모집 범위에 따라)
 */
import { createUjatRegistrationBasicInfoOverlayDefaults } from '@/features/program/ujat/lib/ujat-registration-basic-info-defaults'
import { ProgramRegistrationBusinessKpiParagraph } from '@/features/template/ui/form-set/registration-form/shared/program-registration-business-kpi-paragraph'
import { useUjatProgramRegistrationOverlayKv } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'

export function UjatBusinessKpiParagraph() {
  const defaults = createUjatRegistrationBasicInfoOverlayDefaults()
  const [participantVolunteer] = useUjatProgramRegistrationOverlayKv(
    'ujat.basicInfo.participant.volunteer',
    defaults.participantVolunteer
  )

  return (
    <ProgramRegistrationBusinessKpiParagraph
      instructorDisabled
      instructorPlaceholder="해당 없음"
      volunteerDisabled={!participantVolunteer}
      volunteerPlaceholder={participantVolunteer ? '목표값 입력' : '해당 없음'}
    />
  )
}
