import { FormEditorScaleTypeItems } from '@/features/template/ui/form-editor/form-editor-scale-type-items'
import type { ScaleTypeParagraph } from '@/features/template/model/writing-form-draft.schema'
import type { FormEditorRightPanelUpdateParagraph } from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel.types'

export function ScaleTypeEditor({
  paragraph,
  updateParagraph,
}: {
  paragraph: ScaleTypeParagraph
  updateParagraph: FormEditorRightPanelUpdateParagraph
}) {
  return <FormEditorScaleTypeItems paragraph={paragraph} updateParagraph={updateParagraph} />
}
