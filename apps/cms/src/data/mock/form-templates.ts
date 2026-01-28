/**
 * 신청서 폼 템플릿 Mock 데이터
 * Phase 0.2.2: 템플릿 기반 동적 신청서 (FR-C03)
 */

import type { ApplicationFormTemplate, FormFieldDef } from '@/types/form-template'
import { mockPrograms } from './programs'

/** 개인(참여자)용 커스텀 필드 예시 */
const individualCustomFields: FormFieldDef[] = [
  {
    id: 'participationPurpose',
    label: '참가 목적',
    type: 'textarea',
    required: true,
    placeholder: '이 프로그램에 참여하려는 목적을 구체적으로 적어주세요.',
  },
  {
    id: 'priorExperience',
    label: '관련 경험',
    type: 'textarea',
    required: false,
    placeholder: '관련 경험이 있다면 간단히 적어주세요.',
  },
  {
    id: 'expectedOutcome',
    label: '기대 효과',
    type: 'select',
    required: false,
    options: [
      { value: 'career', label: '진로 탐색' },
      { value: 'finance', label: '금융 이해도 향상' },
      { value: 'network', label: '네트워크 확대' },
      { value: 'other', label: '기타' },
    ],
  },
]

/** 프로그램 ID → 폼 템플릿 매핑 (일부 프로그램에만 커스텀 필드 부여) */
const formTemplatesByProgramId = new Map<string, ApplicationFormTemplate>()

// mockPrograms에서 일부 프로그램에 템플릿 연결 (앞 5개)
mockPrograms.slice(0, 5).forEach((p, idx) => {
  formTemplatesByProgramId.set(p.id, {
    programId: p.id,
    customFields: idx % 2 === 0 ? individualCustomFields : individualCustomFields.slice(0, 1),
  })
})

/**
 * 프로그램 ID로 폼 템플릿 조회
 * 없으면 빈 customFields 템플릿 반환
 */
export function getFormTemplateByProgramId(programId: string): ApplicationFormTemplate {
  const existing = formTemplatesByProgramId.get(programId)
  if (existing) return existing
  return { programId, customFields: [] }
}

export { formTemplatesByProgramId }
