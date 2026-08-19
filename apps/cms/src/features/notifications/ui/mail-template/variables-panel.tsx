import { useMemo, useState } from 'react'
import { Collapse } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { CmsInput } from '@/shared/ui'
import {
  MAIL_TEMPLATE_VARIABLE_GROUPS,
  filterMailVariableGroups,
  formatMailVariableToken,
} from '@/features/notifications/model/mail-template/variables'
import './variables-panel.css'

type VariablesPanelProps = {
  onInsert: (label: string) => void
}

export function VariablesPanel({ onInsert }: VariablesPanelProps) {
  const [query, setQuery] = useState('')
  const groups = useMemo(
    () => filterMailVariableGroups(MAIL_TEMPLATE_VARIABLE_GROUPS, query),
    [query]
  )
  const defaultActiveKey = MAIL_TEMPLATE_VARIABLE_GROUPS.map(group => group.id)

  return (
    <aside className="mail-template-variables">
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
          items={groups.map(group => ({
            key: group.id,
            label: group.label,
            children: (
              <ul className="mail-template-variables__items">
                {group.items.map(item => (
                  <li key={item}>
                    <button
                      type="button"
                      className="mail-template-variables__item"
                      onMouseDown={event => event.preventDefault()}
                      onClick={() => onInsert(item)}
                    >
                      {formatMailVariableToken(item)}
                    </button>
                  </li>
                ))}
              </ul>
            ),
          }))}
        />
      </div>
    </aside>
  )
}
