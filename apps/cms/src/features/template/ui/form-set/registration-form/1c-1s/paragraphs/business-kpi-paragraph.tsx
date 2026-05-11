/**
 * 1사 1교 프로그램 등록 폼 — 사업 KPI 목표 (봉사자 비활성)
 */
import { ProgramRegistrationBusinessKpiParagraph } from '@/features/template/ui/form-set/registration-form/shared/program-registration-business-kpi-paragraph'

export function OneCOneSRegistrationBusinessKpiParagraph() {
  return (
    <ProgramRegistrationBusinessKpiParagraph
      volunteerDisabled
      volunteerPlaceholder="해당 없음"
    />
  )
}
