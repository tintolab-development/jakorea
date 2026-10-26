/**
 * UJAT 프로그램 등록 폼 — 사업 KPI 목표 (강사만 해당 없음 · 봉사자 체크와 KPI 연동)
 */
import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { UjatBusinessKpiProgramView } from '@/features/program/ujat/ui/detail-modal/info/ujat-business-kpi-program-view'

export function UjatBusinessKpiParagraph({
  infoForm,
}: {
  infoForm?: UseFormReturn<ProgramDetailEditFormValues>
}) {
  return (
    <UjatBusinessKpiProgramView
      program={{ generalParticipantTypes: infoForm?.watch('generalParticipantTypes') } as Program}
      isEdit
      form={infoForm}
    />
  )
}
