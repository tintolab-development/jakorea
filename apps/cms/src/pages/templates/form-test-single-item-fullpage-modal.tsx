import { useCallback, useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { getFormNavDisplayLine } from '@/features/template/lib/form-title-numbering'
import {
  createSingleItemPreviewDraft,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  reorderHeadMiddleTail,
  type FormTitleNumberingStyle,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { FormEditorFieldNav } from '@/features/template/ui/form-editor/form-editor-field-nav'
import { FormEditorLeftPane } from '@/features/template/ui/form-editor/form-editor-left-pane'
import {
  FormEditorRightPanel,
  FormEditorTitleNumberingField,
} from '@/features/template/ui/form-editor/form-editor-right-panel'
import { TemplateFullpageModal } from '@/features/template/ui/template-fullpage-modal'
import './form-test-single-item-fullpage-modal.css'

export interface FormTestSingleItemFullpageModalProps {
  open: boolean
  onClose: () => void
}

/**
 * 양식 테스트 > 단일 항목 — `NewSurveyForm`과 동일하게 `FormEditorLeftPane`로 제목·8종·마무리 단락을 렌더
 */
export function FormTestSingleItemFullpageModal({
  open,
  onClose,
}: FormTestSingleItemFullpageModalProps) {
  const [draft, setDraft] = useState<WritingFormDraft>(() => createSingleItemPreviewDraft())
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(
    DEFAULT_SURVEY_PARAGRAPH_IDS.title
  )

  useEffect(() => {
    if (!open) return
    setDraft(createSingleItemPreviewDraft())
    setActiveParagraphId(DEFAULT_SURVEY_PARAGRAPH_IDS.title)
  }, [open])

  const updateParagraph = useCallback(
    (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => {
      setDraft(prev => ({
        ...prev,
        paragraphs: prev.paragraphs.map(p => (p.id === id ? updater(p) : p)),
      }))
    },
    []
  )

  const onReorderMiddle = useCallback((activeId: string, overId: string) => {
    setDraft(prev => ({
      ...prev,
      paragraphs: reorderHeadMiddleTail(prev.paragraphs, activeId, overId),
    }))
  }, [])

  const onTitleNumberingChange = useCallback((style: FormTitleNumberingStyle) => {
    setDraft(prev => ({
      ...prev,
      formSettings: { ...prev.formSettings, titleNumbering: style },
    }))
  }, [])

  const { pinnedTop, sortableMiddle, pinnedBottom } = useMemo(() => {
    const [head, ...rest] = draft.paragraphs
    const tail = rest[rest.length - 1]
    const middle = rest.slice(0, -1)
    const { titleNumbering } = draft.formSettings
    const line = (p: WritingFormParagraph) => ({
      id: p.id,
      displayLine: getFormNavDisplayLine(draft.paragraphs, p, titleNumbering),
    })
    return {
      pinnedTop: line(head!),
      sortableMiddle: middle.map(line),
      pinnedBottom: line(tail!),
    }
  }, [draft])

  const handlePreview = useCallback(() => {
    message.info('미리보기는 추후 연동 예정입니다.')
  }, [])

  const handleSave = useCallback(() => {
    message.success('저장 API 연동 전입니다.')
  }, [])

  return (
    <TemplateFullpageModal
      className="form-test-single-item-fullpage-modal"
      open={open}
      onClose={onClose}
      title="단일 항목 모음"
      description="* 양식 테스트용 미리보기입니다."
      templateTabType="writing"
      leftContent={
        <FormEditorLeftPane
          paragraphs={draft.paragraphs}
          titleNumbering={draft.formSettings.titleNumbering}
          selectedCardId={activeParagraphId}
          onSelectCard={setActiveParagraphId}
          onReorderMiddle={onReorderMiddle}
          updateParagraph={updateParagraph}
          editorKind="survey"
        />
      }
      rightNavigation={
        <FormEditorFieldNav
          sectionTitle="커스텀 필드"
          pinnedTop={pinnedTop}
          sortableMiddle={sortableMiddle}
          pinnedBottom={pinnedBottom}
          selectedItemId={activeParagraphId}
          onSelectItem={setActiveParagraphId}
          onReorderMiddle={onReorderMiddle}
          fieldListBottomSlot={
            <FormEditorTitleNumberingField
              value={draft.formSettings.titleNumbering}
              onChange={onTitleNumberingChange}
            />
          }
        >
          <FormEditorRightPanel
            draft={draft}
            activeParagraphId={activeParagraphId}
            onTitleNumberingChange={onTitleNumberingChange}
            updateParagraph={updateParagraph}
            editorKind="survey"
            showTitleNumbering={false}
          />
        </FormEditorFieldNav>
      }
      onPreview={handlePreview}
      onSave={handleSave}
    />
  )
}
