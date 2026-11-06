import type { WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import { isAgreementLockedSystemParagraph } from '@/features/template/model/writing-form-draft.schema'
import { isTitleWithPeriodParagraph } from '@/features/template/lib/title-with-period-settings'
import type { FormEditorRightPanelUpdateParagraph } from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel.types'
import { TitleWithPeriodSettingsSection } from '@/features/template/ui/form-editor/right-panel/sections/title-with-period-settings-section'

export function ParagraphSettingsSection({
  active,
  updateParagraph,
  lockSurveyWritingPeriodInput = false,
}: {
  active: WritingFormParagraph
  updateParagraph: FormEditorRightPanelUpdateParagraph
  lockSurveyWritingPeriodInput?: boolean
}) {
  return (
    <>
      {isTitleWithPeriodParagraph(active) ? (
        <>
          {!(active.showWritingPeriodOnForm ?? false) ? (
            <span className="form-editor-right-panel__system-hint">
              단락 카드 하단 「작성 기간」을 켜면 시작일·마감일을 설정할 수 있습니다.
            </span>
          ) : null}
          <TitleWithPeriodSettingsSection
            active={active}
            updateParagraph={updateParagraph}
            lockSurveyWritingPeriodInput={lockSurveyWritingPeriodInput}
          />
        </>
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
