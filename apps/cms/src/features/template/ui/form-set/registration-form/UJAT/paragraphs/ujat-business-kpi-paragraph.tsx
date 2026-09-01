/**
 * UJAT 프로그램 등록 폼 — 사업 KPI 목표 (강사만 해당 없음)
 */
import { ProgramRegistrationBusinessKpiParagraph } from '@/features/template/ui/form-set/registration-form/shared/program-registration-business-kpi-paragraph'
import { useUjatProgramRegistrationOverlayKv } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'

export function UjatBusinessKpiParagraph() {
  return (
    <ProgramRegistrationBusinessKpiParagraph
      overlayKeyPrefix="ujat.kpi"
      useOverlayKv={useUjatProgramRegistrationOverlayKv}
      instructorDisabled
      instructorPlaceholder="해당 없음"
    />
  )
}
