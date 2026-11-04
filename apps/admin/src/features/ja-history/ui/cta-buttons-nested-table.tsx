/**
 * JA 살펴보기 — CTA 버튼 값 셀 안 DetailInfoForm
 */

import { DetailInfoForm } from '@jakorea/form-template-runtime'
import { CmsInput } from '@/shared/ui'

type CtaPair = {
  label: string
  href: string
}

type CtaButtonsNestedTableProps = {
  primary: CtaPair
  secondary: CtaPair
  editing: boolean
  onChangePrimary: (patch: Partial<CtaPair>) => void
  onChangeSecondary: (patch: Partial<CtaPair>) => void
}

export function CtaButtonsNestedTable({
  primary,
  secondary,
  editing,
  onChangePrimary,
  onChangeSecondary,
}: CtaButtonsNestedTableProps) {
  const mode = editing ? 'edit' : 'view'

  return (
    <DetailInfoForm title="CTA 버튼" hideHeader mode={mode} className="ja-history-cta-nested-form">
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="버튼명 01"
          labelWidth={220}
          view={<span className="ja-history-cta-nested-form__text">{primary.label || '-'}</span>}
          edit={
            <CmsInput
              inputSize="medium"
              width="100%"
              value={primary.label}
              placeholder="버튼명을 입력해 주세요"
              aria-label="버튼명 01"
              onChange={event => onChangePrimary({ label: event.target.value })}
            />
          }
        />
        <DetailInfoForm.Field
          label="연결 링크 01"
          labelWidth={220}
          view={
            <span className="ja-history-cta-nested-form__text ja-history-cta-nested-form__text--url">
              {primary.href || '-'}
            </span>
          }
          edit={
            <CmsInput
              inputSize="medium"
              width="100%"
              value={primary.href}
              placeholder="연결 링크를 입력해 주세요"
              aria-label="연결 링크 01"
              onChange={event => onChangePrimary({ href: event.target.value })}
            />
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="버튼명 02"
          labelWidth={220}
          view={<span className="ja-history-cta-nested-form__text">{secondary.label || '-'}</span>}
          edit={
            <CmsInput
              inputSize="medium"
              width="100%"
              value={secondary.label}
              placeholder="버튼명을 입력해 주세요"
              aria-label="버튼명 02"
              onChange={event => onChangeSecondary({ label: event.target.value })}
            />
          }
        />
        <DetailInfoForm.Field
          label="연결 링크 02"
          labelWidth={220}
          view={
            <span className="ja-history-cta-nested-form__text ja-history-cta-nested-form__text--url">
              {secondary.href || '-'}
            </span>
          }
          edit={
            <CmsInput
              inputSize="medium"
              width="100%"
              value={secondary.href}
              placeholder="연결 링크를 입력해 주세요"
              aria-label="연결 링크 02"
              onChange={event => onChangeSecondary({ href: event.target.value })}
            />
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
