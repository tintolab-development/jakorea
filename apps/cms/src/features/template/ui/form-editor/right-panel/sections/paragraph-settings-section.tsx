import type { WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import { isAgreementLockedSystemParagraph } from '@/features/template/model/writing-form-draft.schema'
import { isTitleWithPeriodParagraph } from '@/features/template/lib/title-with-period-settings'
import type { FormEditorRightPanelUpdateParagraph } from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel.types'
import { TitleWithPeriodSettingsSection } from '@/features/template/ui/form-editor/right-panel/sections/title-with-period-settings-section'

export function ParagraphSettingsSection({
  active,
  updateParagraph,
}: {
  active: WritingFormParagraph
  updateParagraph: FormEditorRightPanelUpdateParagraph
}) {
  return (
    <>
      {isTitleWithPeriodParagraph(active) ? (
        <TitleWithPeriodSettingsSection active={active} updateParagraph={updateParagraph} />
      ) : null}

      {active.kind === 'description' &&
      active.variant === 'system' &&
      isAgreementLockedSystemParagraph(active) ? (
        <span className="form-editor-right-panel__system-hint">
          시스템 설정 항목입니다. 내용 추가·삭제·편집은 할 수 없습니다.
        </span>
      ) : null}
    </>
  )
}
