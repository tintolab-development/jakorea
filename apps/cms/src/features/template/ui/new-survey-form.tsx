import { useCallback, useMemo, useState } from 'react'
import { message } from 'antd'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { TemplateFullpageModal } from '@/features/template/ui/template-fullpage-modal'
import { getSurveyNavDisplayLine } from '@/features/template/lib/survey-title-numbering'
import {
  createDefaultSurveyDraft,
  DEFAULT_SURVEY_PARAGRAPH_IDS,
  reorderSurveyMiddleParagraphs,
  type SurveyDraft,
  type SurveyParagraph,
  type SurveyTitleNumberingStyle,
} from '@/features/template/model/survey-draft.schema'
import { SurveyEditorLeftPane } from '@/features/template/ui/survey/survey-editor-left-pane'
import { SurveyEditorRightPanel } from '@/features/template/ui/survey/survey-editor-right-panel'
import { SurveyEditorFieldNav } from '@/features/template/ui/survey/survey-editor-field-nav'

type NewSurveyFormQuery = {
  mode?: string
  type?: string
  id?: string
}

export default function NewSurveyForm() {
  const { setParams } = useQueryParams<NewSurveyFormQuery>()
  const [draft, setDraft] = useState<SurveyDraft>(() => createDefaultSurveyDraft())
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(
    DEFAULT_SURVEY_PARAGRAPH_IDS.title
  )

  const handleClose = useCallback(() => {
    setParams({ mode: undefined, type: undefined, id: undefined })
  }, [setParams])

  const updateParagraph = useCallback(
    (id: string, updater: (p: SurveyParagraph) => SurveyParagraph) => {
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
      paragraphs: reorderSurveyMiddleParagraphs(prev.paragraphs, activeId, overId),
    }))
  }, [])

  const onTitleNumberingChange = useCallback((style: SurveyTitleNumberingStyle) => {
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
    const line = (p: SurveyParagraph) => ({
      id: p.id,
      displayLine: getSurveyNavDisplayLine(draft.paragraphs, p, titleNumbering),
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

  return (
    <TemplateFullpageModal
      open
      onClose={handleClose}
      title="설문조사"
      description="* 등록 시 최소 1개의 단락은 존재해야 합니다."
      templateTabType="writing"
      leftContent={
        <SurveyEditorLeftPane
          paragraphs={draft.paragraphs}
          titleNumbering={draft.formSettings.titleNumbering}
          selectedCardId={activeParagraphId}
          onSelectCard={setActiveParagraphId}
          onReorderMiddle={onReorderMiddle}
          updateParagraph={updateParagraph}
        />
      }
      rightNavigation={
        <SurveyEditorFieldNav
          sectionTitle="커스텀 필드"
          pinnedTop={pinnedTop}
          sortableMiddle={sortableMiddle}
          pinnedBottom={pinnedBottom}
          selectedItemId={activeParagraphId}
          onSelectItem={setActiveParagraphId}
          onReorderMiddle={onReorderMiddle}
        >
          <SurveyEditorRightPanel
            draft={draft}
            activeParagraphId={activeParagraphId}
            onTitleNumberingChange={onTitleNumberingChange}
            updateParagraph={updateParagraph}
          />
        </SurveyEditorFieldNav>
      }
      onPreview={handlePreview}
      onSave={handleSave}
    />
  )
}
