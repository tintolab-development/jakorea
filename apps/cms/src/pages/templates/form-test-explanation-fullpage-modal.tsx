import { useCallback, useEffect, useMemo, useState } from 'react'
import { message } from 'antd'
import { getFormNavDisplayLine } from '@/features/template/lib/form-title-numbering'
import {
  createExplanationTypesPreviewDraft,
  DEFAULT_FORM_TEST_EXPLANATION_PARAGRAPH_IDS,
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
import './form-test-explanation-fullpage-modal.css'

export interface FormTestExplanationFullpageModalProps {
  open: boolean
  onClose: () => void
}

/**
 * 양식 테스트 > 설명글 유형 — 제목형·텍스트형·기타·마무리글형 (`FormTab` 단일 항목 모음과 동일 패턴)
 */
export function FormTestExplanationFullpageModal({
  open,
  onClose,
}: FormTestExplanationFullpageModalProps) {
  const [draft, setDraft] = useState<WritingFormDraft>(() => createExplanationTypesPreviewDraft())
  const [singleItemListActiveItemId, setSingleItemListActiveItemId] = useState<string | null>(null)
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(
    DEFAULT_FORM_TEST_EXPLANATION_PARAGRAPH_IDS.title
  )

  useEffect(() => {
    if (!open) return
    setDraft(createExplanationTypesPreviewDraft())
    setActiveParagraphId(DEFAULT_FORM_TEST_EXPLANATION_PARAGRAPH_IDS.title)
    setSingleItemListActiveItemId(null)
  }, [open])

  const handleSelectCard = useCallback((id: string) => {
    setActiveParagraphId(id)
    setSingleItemListActiveItemId(null)
  }, [])

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
      className="form-test-explanation-fullpage-modal"
      open={open}
      onClose={onClose}
      title="설명글 유형 모음"
      description="* 양식 테스트용 미리보기입니다."
      templateTabType="writing"
      leftContent={
        <FormEditorLeftPane
          paragraphs={draft.paragraphs}
          titleNumbering={draft.formSettings.titleNumbering}
          selectedCardId={activeParagraphId}
          onSelectCard={handleSelectCard}
          onReorderMiddle={onReorderMiddle}
          updateParagraph={updateParagraph}
          editorKind="survey"
          singleItemListActiveItemId={singleItemListActiveItemId}
          onSelectSingleItemListItem={(paragraphId, itemId) => {
            setActiveParagraphId(paragraphId)
            setSingleItemListActiveItemId(itemId)
          }}
        />
      }
      rightNavigation={
        <FormEditorFieldNav
          sectionTitle="커스텀 필드"
          pinnedTop={pinnedTop}
          sortableMiddle={sortableMiddle}
          pinnedBottom={pinnedBottom}
          selectedItemId={activeParagraphId}
          onSelectItem={handleSelectCard}
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
            singleItemListActiveItemId={singleItemListActiveItemId}
          />
        </FormEditorFieldNav>
      }
      onPreview={handlePreview}
      onSave={handleSave}
    />
  )
}
