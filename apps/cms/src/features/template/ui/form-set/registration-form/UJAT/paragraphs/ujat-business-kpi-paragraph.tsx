/**
 * UJAT 프로그램 등록 폼 — 사업 KPI 목표 (강사 비활성, 1사 1교와 반대)
 */
import { ProgramRegistrationBusinessKpiParagraph } from '@/features/template/ui/form-set/registration-form/shared/program-registration-business-kpi-paragraph'

export function UjatBusinessKpiParagraph() {
  return (
    <ProgramRegistrationBusinessKpiParagraph
      instructorDisabled
      instructorPlaceholder="해당 없음"
    />
  )
}
