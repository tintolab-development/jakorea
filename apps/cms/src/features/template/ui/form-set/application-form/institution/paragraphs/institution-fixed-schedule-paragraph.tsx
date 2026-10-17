import { useMemo } from 'react'
import { resolveFixedScheduleLinesToChoiceItems } from '@jakorea/form-schema/program-application'
import {
  useInstitutionApplicationProgramBridge,
  type InstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import {
  useGeneralApplicationOverlayKv,
  updateGeneralApplicationOverlayKey,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import '@/features/template/ui/paragraph/single-item/multiple-choice.css'

/** 날짜 지정 등 — 프로그램 등록 교육 진행 예정일 목록에서 선택 (미리보기·응답용) */
export function ProgramApplicationFormInstitutionFixedScheduleParagraph({
  readOnlyPreview = false,
  programBridge,
}: {
  readOnlyPreview?: boolean
  programBridge?: InstitutionApplicationProgramBridge
}) {
  const storeBridge = useInstitutionApplicationProgramBridge()
  const bridge = programBridge ?? storeBridge
  const choiceItems = useMemo(() => {
    const lines =
      bridge.educationScheduleLines?.map(line => line.trim()).filter(Boolean) ?? []
    const metaInput = {
      educationRoundCount: bridge.educationRoundCount,
      sessionsPerRound: bridge.sessionsPerRound,
      curriculumChartSessionCount: bridge.curriculumChartSessionCount,
    }
    return resolveFixedScheduleLinesToChoiceItems(
      {
        educationStructure: bridge.educationStructure,
        sessionRound: bridge.sessionRound,
        educationScheduleMode: bridge.educationScheduleMode,
        educationScheduleLines: lines,
      },
      lines,
      metaInput
    )
  }, [
    bridge.curriculumChartSessionCount,
    bridge.educationRoundCount,
    bridge.educationScheduleLines,
    bridge.educationScheduleMode,
    bridge.educationStructure,
    bridge.sessionRound,
    bridge.sessionsPerRound,
  ])

  const [selectedIds] = useGeneralApplicationOverlayKv<string[]>(
    'application.institution.fixedScheduleSelected',
    []
  )

  const toggleOption = (optionId: string, checked: boolean) => {
    if (readOnlyPreview) return
    updateGeneralApplicationOverlayKey<string[]>('application.institution.fixedScheduleSelected', prev => {
      const current = (prev ?? []) as string[]
      if (checked) {
        return current.includes(optionId) ? current : [...current, optionId]
      }
      return current.filter(id => id !== optionId)
    })
  }

  if (choiceItems.length === 0) {
    return (
      <span className="form-editor-template-field-hint-text">
        선택 가능한 교육 일정이 없습니다.
      </span>
    )
  }

  return (
    <div className="multiple-choice-body">
      {choiceItems.map(item => (
        <div key={item.id} role="presentation" className="multiple-choice-row">
          <CmsCheckbox
            disabled={readOnlyPreview}
            checked={selectedIds.includes(item.id)}
            onChange={event => toggleOption(item.id, event.target.checked)}
          />
          <span className="multiple-choice-row__label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
