import { Form } from 'antd'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import type { WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import { isAgreementLockedSystemParagraph } from '@/features/template/model/writing-form-draft.schema'
import type { FormEditorRightPanelUpdateParagraph } from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel.types'

export function ParagraphSettingsSection({
  active,
  updateParagraph,
}: {
  active: WritingFormParagraph
  updateParagraph: FormEditorRightPanelUpdateParagraph
}) {
  return (
    <>
      {active.kind === 'description' && active.variant === 'survey_title_with_period' ? (
        <>
          {(active.showWritingPeriodOnForm ?? false) ? (
            <>
              <Form.Item label={'설문 시작일'}>
                <CmsRadioGroup
                  value={active.periodMode}
                  onChange={e =>
                    updateParagraph(active.id, () => ({
                      ...active,
                      periodMode: e.target.value,
                    }))
                  }
                >
                  <CmsRadio value="immediate">바로 시작</CmsRadio>
                  <CmsRadio value="custom">직접 설정</CmsRadio>
                </CmsRadioGroup>
              </Form.Item>
              <Form.Item label={'설문 종료일'}>
                <CmsRadioGroup
                  value={active.periodMode}
                  onChange={e =>
                    updateParagraph(active.id, () => ({
                      ...active,
                      periodMode: e.target.value,
                    }))
                  }
                >
                  <CmsRadio value="immediate">마감 없음</CmsRadio>
                  <CmsRadio value="custom">직접 설정</CmsRadio>
                </CmsRadioGroup>
              </Form.Item>
            </>
          ) : null}
        </>
      ) : null}

      {active.kind === 'description' &&
      active.variant === 'system' &&
      isAgreementLockedSystemParagraph(active) ? (
        <Form.Item>
          <span className="form-editor-right-panel__system-hint">
            시스템 설정 항목입니다. 내용 추가·삭제·편집은 할 수 없습니다.
          </span>
        </Form.Item>
      ) : null}
    </>
  )
}
