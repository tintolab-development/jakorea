import { Form } from 'antd'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import type {
  SessionPlanShortEssayParagraph,
  ShortEssayParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { paragraphVariantLabel } from '@/features/template/ui/form-editor/right-panel/config/paragraph-editor.registry'
import type { FormEditorRightPanelUpdateParagraph } from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel.types'

export function ShortEssayEditor({
  activeShortEssay,
  selectedShortEssayItem,
  shortEssayShowItemTitle,
  updateParagraph,
}: {
  activeShortEssay: ShortEssayParagraph | SessionPlanShortEssayParagraph
  selectedShortEssayItem: {
    id: string
    label?: string
    placeholder?: string
    bodyText: string
  }
  shortEssayShowItemTitle: boolean
  updateParagraph: FormEditorRightPanelUpdateParagraph
}) {
  return (
    <>
      <Form.Item label="항목 유형">
        <CmsSelect
          width="100%"
          value={paragraphVariantLabel(activeShortEssay)}
          options={[
            {
              value: paragraphVariantLabel(activeShortEssay),
              label: paragraphVariantLabel(activeShortEssay),
            },
          ]}
          disabled
        />
      </Form.Item>
      {shortEssayShowItemTitle ? (
        <Form.Item label="항목명">
          <CmsInput
            width="100%"
            value={selectedShortEssayItem.label ?? ''}
            onChange={e =>
              updateParagraph(activeShortEssay.id, cur => {
                if (
                  cur.kind !== 'single_item' ||
                  (cur.variant !== 'short_essay' && cur.variant !== 'session_plan_short_essay')
                )
                  return cur
                const items =
                  cur.items?.length && cur.items.length > 0
                    ? cur.items
                    : [
                        {
                          id:
                            cur.variant === 'session_plan_short_essay'
                              ? 'session-plan-item-1'
                              : 'short-essay-item-1',
                          label: 'Title 01',
                          placeholder: cur.bodyPlaceholder,
                          bodyText: cur.bodyText,
                        },
                      ]
                return {
                  ...cur,
                  items: items.map(item =>
                    item.id === selectedShortEssayItem.id
                      ? { ...item, label: e.target.value }
                      : item
                  ),
                }
              })
            }
            placeholder="항목명을 입력해 주세요"
          />
        </Form.Item>
      ) : null}
      <Form.Item label="입력창 안내 텍스트">
        <CmsInput
          width="100%"
          value={selectedShortEssayItem.placeholder ?? activeShortEssay.bodyPlaceholder}
          onChange={e =>
            updateParagraph(activeShortEssay.id, cur => {
              if (
                cur.kind !== 'single_item' ||
                (cur.variant !== 'short_essay' && cur.variant !== 'session_plan_short_essay')
              )
                return cur
              const items =
                cur.items?.length && cur.items.length > 0
                  ? cur.items
                  : [
                      {
                        id:
                          cur.variant === 'session_plan_short_essay'
                            ? 'session-plan-item-1'
                            : 'short-essay-item-1',
                        label: 'Title 01',
                        placeholder: cur.bodyPlaceholder,
                        bodyText: cur.bodyText,
                      },
                    ]
              return {
                ...cur,
                bodyPlaceholder: e.target.value,
                items: items.map(item =>
                  item.id === selectedShortEssayItem.id
                    ? { ...item, placeholder: e.target.value }
                    : item
                ),
              }
            })
          }
          placeholder="답변을 입력해 주세요"
        />
      </Form.Item>
    </>
  )
}
