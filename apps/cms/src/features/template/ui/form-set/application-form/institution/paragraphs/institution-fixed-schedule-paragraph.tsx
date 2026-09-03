import { useMemo } from 'react'
import { useInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { resolveInstitutionFixedScheduleDescription } from '@/features/template/lib/institution-application-schedule-copy'
import {
  useGeneralApplicationOverlayKv,
  updateGeneralApplicationOverlayKey,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import '@/features/template/ui/paragraph/single-item/multiple-choice.css'

/** 날짜 지정 등 — 프로그램 등록 교육 진행 예정일 목록에서 선택 (미리보기·응답용) */
export function ProgramApplicationFormInstitutionFixedScheduleParagraph({
  readOnlyPreview = false,
}: {
  readOnlyPreview?: boolean
}) {
  const bridge = useInstitutionApplicationProgramBridge()
  const description = resolveInstitutionFixedScheduleDescription(bridge)
  const lines = useMemo(() => {
    const fromBridge = bridge.educationScheduleLines
      ?.map(line => line.trim())
      .filter(Boolean)
    return fromBridge ?? []
  }, [bridge.educationScheduleLines])

  const [selectedLines] = useGeneralApplicationOverlayKv<string[]>(
    'application.institution.fixedScheduleSelected',
    []
  )

  const toggleLine = (line: string, checked: boolean) => {
    if (readOnlyPreview) return
    updateGeneralApplicationOverlayKey<string[]>('application.institution.fixedScheduleSelected', prev => {
      const current = (prev ?? []) as string[]
      if (checked) {
        return current.includes(line) ? current : [...current, line]
      } else {
        return current.filter((l: string) => l !== line)
      }
    })
  }

  if (lines.length === 0) {
    return (
      <span className="form-editor-template-field-hint-text">
        선택 가능한 교육 일정이 없습니다.
      </span>
    )
  }

  return (
    <div className="multiple-choice-body">
      <p className="form-editor-template-field-hint-text institution-fixed-schedule-paragraph__hint">
        {description}
      </p>
      {lines.map(line => (
        <div key={line} role="presentation" className="multiple-choice-row">
          <CmsCheckbox
            disabled={readOnlyPreview}
            checked={selectedLines.includes(line)}
            onChange={event => toggleLine(line, event.target.checked)}
          />
          <span className="multiple-choice-row__label">{line}</span>
        </div>
      ))}
    </div>
  )
}
