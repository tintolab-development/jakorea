/**
 * 콘텐츠 01/02 값 셀 안 중첩 테이블 — 타이틀 + 설명글
 */
import { DetailInfoForm } from '@jakorea/form-template-runtime'
import type { IntroContentBlock } from '@/entities/ja-korea-intro/model/types'
import { CmsInput, CmsTextArea } from '@/shared/ui'

type ContentNestedTableProps = {
  data: IntroContentBlock
  mode: 'view' | 'edit'
  ariaLabel: string
  onChange: (patch: Partial<IntroContentBlock>) => void
}

export function ContentNestedTable({ data, mode, ariaLabel, onChange }: ContentNestedTableProps) {
  return (
    <DetailInfoForm title={ariaLabel} hideHeader mode={mode} className="ja-korea-intro-nested-form">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="타이틀"
          required
          view={<span className="ja-korea-intro-preline">{data.title || '-'}</span>}
          edit={
            <CmsInput
              inputSize="medium"
              width="100%"
              value={data.title}
              onChange={e => onChange({ title: e.target.value })}
              placeholder="타이틀을 입력해 주세요"
              aria-label={`${ariaLabel} 타이틀`}
            />
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="설명글"
          required
          view={<span className="ja-korea-intro-preline">{data.description || '-'}</span>}
          edit={
            <CmsTextArea
              inputSize="medium"
              width="100%"
              autoSize={{ minRows: 1, maxRows: 2 }}
              value={data.description}
              onChange={e => onChange({ description: e.target.value })}
              placeholder="설명글을 입력해 주세요"
              aria-label={`${ariaLabel} 설명글`}
            />
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
