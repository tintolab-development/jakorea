import { memo, useCallback, useMemo, useState } from 'react'
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
  onDisabledInsert?: () => void
  /** remote catalog; 없으면 정적 MAIL_TEMPLATE_VARIABLE_GROUPS */
  groups?: MailVariableGroup[]
  /** 항목별 비활성 (발송 화면 requiresProgram 가드 등) */
  isItemDisabled?: (label: string) => boolean
  /**
   * false면 catalog `enabled` 를 무시하고 전부 삽입 가능.
   * 템플릿 **등록/수정** = false, 발송 = true(기본).
   */
  respectCatalogEnabled?: boolean
}

export const VariablesPanel = memo(function VariablesPanel({
  onInsert,
  disabled,
  onDisabledInsert,
  groups: groupsProp,
  isItemDisabled,
  respectCatalogEnabled = true,
}: VariablesPanelProps) {
  const [query, setQuery] = useState('')
  const sourceGroups = groupsProp?.length ? groupsProp : MAIL_TEMPLATE_VARIABLE_GROUPS
  const groups = useMemo(() => filterMailVariableGroups(sourceGroups, query), [query, sourceGroups])
  // 시안: 기본 전부 펼침. remote catalog가 늦게 와도 펼친 상태가 되도록
  // defaultActiveKey(마운트 1회) 대신 「사용자가 접은 그룹」만 기억해 activeKey를 제어한다.
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<ReadonlySet<string>>(() => new Set())
  const activeKey = useMemo(
    () => groups.map(group => group.id).filter(id => !collapsedGroupIds.has(id)),
    [collapsedGroupIds, groups]
  )
  const handleCollapseChange = useCallback(
    (keys: string | string[]) => {
      const opened = new Set(Array.isArray(keys) ? keys : [keys])
      setCollapsedGroupIds(prev => {
        const next = new Set(prev)
        for (const group of groups) {
          if (opened.has(group.id)) next.delete(group.id)
          else next.add(group.id)
        }
        return next
      })
    },
    [groups]
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
                  >
                    <span className="mail-template-variables__item-label">
                      {formatMailVariableToken(label)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ),
      })),
    [
      disabled,
      groups,
      isItemDisabled,
      onDisabledInsert,
      onInsert,
      respectCatalogEnabled,
    ]
  )

  return (
    <aside
      className={
        disabled
          ? 'mail-template-variables mail-template-variables--disabled'
          : 'mail-template-variables'
      }
      aria-disabled={disabled || undefined}
    >
      <h3 className="mail-template-variables__title">자동입력(변수값)</h3>
      <CmsInput
        className="mail-template-variables__search"
        inputSize="large"
        width="100%"
        placeholder="검색어를 입력해 주세요"
        value={query}
        onChange={event => setQuery(event.target.value)}
        allowClear
        icon={<SearchOutlined />}
      />
      <div className="mail-template-variables__list">
        <Collapse
          ghost
          bordered={false}
          expandIconPosition="start"
          activeKey={activeKey}
          onChange={handleCollapseChange}
          items={collapseItems}
        />
      </div>
    </aside>
  )
})
