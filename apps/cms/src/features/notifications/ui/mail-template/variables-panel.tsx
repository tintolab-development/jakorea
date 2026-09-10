import { memo, useMemo, useState } from 'react'
import { Collapse } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { CmsInput } from '@/shared/ui'
import {
  MAIL_TEMPLATE_VARIABLE_GROUPS,
  filterMailVariableGroups,
  formatMailVariableToken,
  getMailVariableLabel,
  type MailVariableGroup,
} from '@/features/notifications/model/mail-template/variables'
import './variables-panel.css'

type VariablesPanelProps = {
  onInsert: (label: string) => void
  disabled?: boolean
  disabledReason?: string
  onDisabledInsert?: () => void
  /** remote catalog; 없으면 정적 MAIL_TEMPLATE_VARIABLE_GROUPS */
  groups?: MailVariableGroup[]
  /** 항목별 비활성 (발송 화면 requiresProgram 가드 등) */
  isItemDisabled?: (label: string) => boolean
  itemDisabledReason?: string
  /**
   * false면 catalog `enabled` 를 무시하고 전부 삽입 가능.
   * 템플릿 **등록/수정** = false, 발송 = true(기본).
   */
  respectCatalogEnabled?: boolean
}

export const VariablesPanel = memo(function VariablesPanel({
  onInsert,
  disabled,
  disabledReason,
  onDisabledInsert,
  groups: groupsProp,
  isItemDisabled,
  itemDisabledReason,
  respectCatalogEnabled = true,
}: VariablesPanelProps) {
  const [query, setQuery] = useState('')
  const sourceGroups = groupsProp?.length ? groupsProp : MAIL_TEMPLATE_VARIABLE_GROUPS
  const defaultActiveKey = useMemo(() => sourceGroups.map(group => group.id), [sourceGroups])
  const groups = useMemo(
    () => filterMailVariableGroups(sourceGroups, query),
    [query, sourceGroups]
  )
  const collapseItems = useMemo(
    () =>
      groups.map(group => ({
        key: group.id,
        label: group.label,
        children: (
          <ul className="mail-template-variables__items">
            {group.items.map(variable => {
              const label = getMailVariableLabel(variable)
              const catalogLocked =
                respectCatalogEnabled &&
                Object.prototype.hasOwnProperty.call(variable, 'enabled') &&
                variable.enabled !== true
              const itemDisabled = catalogLocked || Boolean(isItemDisabled?.(label))
              const locked = disabled || itemDisabled
              const reason = disabled
                ? disabledReason
                : itemDisabled
                  ? itemDisabledReason ||
                    (catalogLocked
                      ? '현재 프로그램/참여 유형에서는 사용할 수 없는 변수입니다.'
                      : variable.hint)
                  : undefined
              return (
                <li key={label}>
                  <button
                    type="button"
                    className="mail-template-variables__item"
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => {
                      if (locked) {
                        onDisabledInsert?.()
                        return
                      }
                      onInsert(label)
                    }}
                    aria-disabled={locked || undefined}
                    title={reason}
                  >
                    <span className="mail-template-variables__item-label">
                      {formatMailVariableToken(label)}
                    </span>
                    {variable.hint ? (
                      <span className="mail-template-variables__item-hint">{variable.hint}</span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        ),
      })),
    [
      disabled,
      disabledReason,
      groups,
      isItemDisabled,
      itemDisabledReason,
      onDisabledInsert,
      onInsert,
      respectCatalogEnabled,
    ]
  )

  return (
    <aside
      className={
        disabled ? 'mail-template-variables mail-template-variables--disabled' : 'mail-template-variables'
      }
      aria-disabled={disabled || undefined}
    >
      <h3 className="mail-template-variables__title">자동입력(변수값)</h3>
      <CmsInput
        className="mail-template-variables__search"
        inputSize="large"
        width="100%"
        placeholder="검색어를 입력하세요"
        value={query}
        onChange={event => setQuery(event.target.value)}
        allowClear
        icon={<SearchOutlined />}
      />
      <div className="mail-template-variables__list">
        <Collapse
          ghost
          bordered={false}
          expandIconPosition="end"
          defaultActiveKey={defaultActiveKey}
          items={collapseItems}
        />
      </div>
    </aside>
  )
})
