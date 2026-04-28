import { useCallback, useMemo, useState } from 'react'
import { message } from 'antd'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { TemplateFullpageModal } from '@/features/template/ui/template-fullpage-modal'
import { getFormNavDisplayLine } from '@/features/template/lib/form-title-numbering'
import {
  createDefaultSurveyDraft,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  reorderWritingFormMiddleParagraphs,
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

type NewSurveyFormQuery = {
  mode?: string
  type?: string
  id?: string
}

export default function NewSurveyForm() {
  const { setParams } = useQueryParams<NewSurveyFormQuery>()
  const [draft, setDraft] = useState<WritingFormDraft>(() => createDefaultSurveyDraft())
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(
    DEFAULT_SURVEY_PARAGRAPH_IDS.title
  )
  const [singleItemListActiveItemId, setSingleItemListActiveItemId] = useState<string | null>(null)

  const handleClose = useCallback(() => {
    setParams({ mode: undefined, type: undefined, id: undefined })
  }, [setParams])

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
      paragraphs: reorderWritingFormMiddleParagraphs(prev.paragraphs, activeId, overId),
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
      pinnedTop: line(head),
      sortableMiddle: middle.map(line),
      pinnedBottom: line(tail),
    }
  }, [draft])

  const handlePreview = useCallback(() => {
    message.info('미리보기는 추후 연동 예정입니다.')
  }, [])

  const handleSave = useCallback(() => {
    message.success('저장 API 연동 전입니다.')
  }, [])

  const handleSelectParagraph = useCallback((id: string) => {
    setActiveParagraphId(id)
    setSingleItemListActiveItemId(null)
  }, [])

  return (
    <TemplateFullpageModal
      open
      onClose={handleClose}
      title="설문조사"
      description="* 등록 시 최소 1개의 단락은 존재해야 합니다."
      templateTabType="writing"
      leftContent={
        <FormEditorLeftPane
          paragraphs={draft.paragraphs}
          titleNumbering={draft.formSettings.titleNumbering}
          selectedCardId={activeParagraphId}
          onSelectCard={handleSelectParagraph}
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
          onSelectItem={handleSelectParagraph}
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
