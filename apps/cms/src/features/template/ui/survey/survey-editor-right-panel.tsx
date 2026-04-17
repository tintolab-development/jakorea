import { Form, Space, Switch, Typography } from 'antd'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import type {
  SurveyDraft,
  SurveyParagraph,
  SurveyPeriodMode,
  SurveyTitleNumberingStyle,
} from '@/features/template/model/survey-draft.schema'
import { surveyOutlineLabel } from '@/features/template/model/survey-draft.schema'
import './survey-editor.css'

const TITLE_NUMBERING_OPTIONS: { value: SurveyTitleNumberingStyle; label: string }[] = [
  { value: 'numeric', label: '1, 2, 3' },
  { value: 'alpha', label: 'A, B, C' },
  { value: 'q_repeat', label: 'Q, Q, Q' },
  { value: 'q123', label: 'Q1, Q2, Q3' },
  { value: 'none', label: '미선택' },
]

function paragraphKindLabel(p: SurveyParagraph): string {
  if (p.kind === 'description') return '설명글'
  return '단일항목'
}

function paragraphVariantLabel(p: SurveyParagraph): string {
  switch (p.variant) {
    case 'survey_title_with_period':
      return '설문 제목형'
    case 'user_profile':
      return '사용자 정보형'
    case 'score_select':
      return '점수 선택형'
    case 'subjective':
      return '주관식형'
    case 'closing':
      return '마무리글형'
  }
}

export interface SurveyEditorRightPanelProps {
  draft: SurveyDraft
  activeParagraphId: string | null
  onTitleNumberingChange: (style: SurveyTitleNumberingStyle) => void
  updateParagraph: (id: string, updater: (p: SurveyParagraph) => SurveyParagraph) => void
}

export function SurveyEditorRightPanel({
  draft,
  activeParagraphId,
  onTitleNumberingChange,
  updateParagraph,
}: SurveyEditorRightPanelProps) {
  const active = draft.paragraphs.find(p => p.id === activeParagraphId) ?? null
  const outline = active ? surveyOutlineLabel(active) : ''

  return (
    <div className="survey-editor-right-panel">
      <div className="survey-editor-right-panel__field">
        <span className="survey-editor-right-panel__label">타이틀 번호</span>
        <CmsSelect
          width="100%"
          className="survey-editor-right-panel__select"
          value={draft.formSettings.titleNumbering}
          options={TITLE_NUMBERING_OPTIONS}
          onChange={v => onTitleNumberingChange(v as SurveyTitleNumberingStyle)}
        />
      </div>

      {active ? (
        <>
          <Typography.Title level={5} className="survey-editor-right-panel__section-title">
            {outline}
          </Typography.Title>
          <Form layout="vertical" className="survey-editor-right-panel__form" requiredMark={false}>
            <Form.Item label="단락 종류">
              <div className="survey-editor-right-panel__kind-row">
                <CmsSelect
                  width="100%"
                  value={paragraphKindLabel(active)}
                  options={[{ value: paragraphKindLabel(active), label: paragraphKindLabel(active) }]}
                  disabled
                />
                <CmsSelect
                  width="100%"
                  value={paragraphVariantLabel(active)}
                  options={[
                    { value: paragraphVariantLabel(active), label: paragraphVariantLabel(active) },
                  ]}
                  disabled
                />
              </div>
            </Form.Item>

            {active.kind === 'description' && active.variant === 'survey_title_with_period' ? (
              <>
                <Form.Item label="설문 제목">
                  <CmsInput
                    width="100%"
                    value={active.surveyTitle}
                    onChange={e =>
                      updateParagraph(active.id, () => ({
                        ...active,
                        surveyTitle: e.target.value,
                      }))
                    }
                    placeholder="설문 제목을 입력해 주세요"
                  />
                </Form.Item>
                <Form.Item label="설문 설명">
                  <CmsTextArea
                    width="100%"
                    value={active.surveyDescription}
                    onChange={e =>
                      updateParagraph(active.id, () => ({
                        ...active,
                        surveyDescription: e.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="설명 입력"
                  />
                </Form.Item>
                <Form.Item label="설문 시작일">
                  <CmsRadioGroup
                    value={active.periodMode}
                    onChange={e =>
                      updateParagraph(active.id, () => ({
                        ...active,
                        periodMode: e.target.value as SurveyPeriodMode,
                      }))
                    }
                  >
                    <Space direction="vertical" size={8}>
                      <CmsRadio value="immediate">바로 시작</CmsRadio>
                      <CmsRadio value="custom">직접 설정</CmsRadio>
                    </Space>
                  </CmsRadioGroup>
                </Form.Item>
                <Form.Item label="작성 기간 노출">
                  <Switch
                    checked={active.showWritingPeriodOnForm}
                    onChange={checked =>
                      updateParagraph(active.id, () => ({
                        ...active,
                        showWritingPeriodOnForm: checked,
                      }))
                    }
                  />
                </Form.Item>
              </>
            ) : null}

            {active.kind === 'single_item' ? (
              <Form.Item label="단락 타이틀(원문)">
                <CmsInput
                  width="100%"
                  value={active.paragraphTitle}
                  onChange={e =>
                    updateParagraph(active.id, () => ({
                      ...active,
                      paragraphTitle: e.target.value,
                    }))
                  }
                  placeholder="타이틀을 입력해 주세요"
                />
              </Form.Item>
            ) : null}

            {active.kind === 'single_item' && active.variant === 'subjective' ? (
              <Form.Item label="단락 설명">
                <CmsTextArea
                  width="100%"
                  value={active.paragraphDescription}
                  onChange={e =>
                    updateParagraph(active.id, () => ({
                      ...active,
                      paragraphDescription: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </Form.Item>
            ) : null}

            {active.kind === 'description' && active.variant === 'closing' ? (
              <Form.Item label="마무리 문구">
                <CmsTextArea
                  width="100%"
                  value={active.body}
                  onChange={e =>
                    updateParagraph(active.id, () => ({
                      ...active,
                      body: e.target.value,
                    }))
                  }
                  rows={4}
                />
              </Form.Item>
            ) : null}
          </Form>
        </>
      ) : null}
    </div>
  )
}
