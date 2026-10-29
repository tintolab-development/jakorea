import { isProgramSurveyManagementFormBinding } from '@/features/program/general/api/adapters/program-survey-adapters'
import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'

type ProgramSurveyBindingIdentity = {
  bindingId?: number | null
  templateId?: number | null
  templateVersionId?: number | null
}

/**
 * `/surveys` 행에 대응하는 활성 설문 바인딩.
 * 목록 상태(진행 전·진행 중·종료)는 바인딩 기간으로 계산하므로 행마다 바인딩을 넘겨야 한다.
 * bindingId → templateVersionId → templateId 순으로 찾는다(bb6f8755f 이전 merge 기준 + bindingId 우선).
 */
export function findProgramSurveyBinding(
  dto: ProgramSurveyBindingIdentity,
  bindings: readonly ProgramFormBindingResponse[]
): ProgramFormBindingResponse | undefined {
  const candidates = bindings.filter(
    binding => binding.active !== false && isProgramSurveyManagementFormBinding(binding)
  )
  if (dto.bindingId != null) {
    const byId = candidates.find(binding => String(binding.bindingId ?? '') === String(dto.bindingId))
    if (byId) return byId
  }
  if (dto.templateVersionId != null) {
    const byVersion = candidates.find(
      binding => String(binding.templateVersionId ?? '') === String(dto.templateVersionId)
    )
    if (byVersion) return byVersion
  }
  if (dto.templateId != null) {
    return candidates.find(binding => String(binding.templateId ?? '') === String(dto.templateId))
  }
  return undefined
}
