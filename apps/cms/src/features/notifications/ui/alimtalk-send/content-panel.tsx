import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { AlimtalkNestedTable, type AlimtalkNestedLine } from '@/shared/ui/alimtalk-nested-table'
import type {
  AlimtalkLinkDestinations,
  AlimtalkTemplateItem,
} from '@/features/notifications/model/alimtalk-template/types'

type ContentPanelProps = {
  template: AlimtalkTemplateItem
}

const DESTINATION_LABELS: { key: keyof AlimtalkLinkDestinations; label: string }[] = [
  { key: 'pc', label: 'PC' },
  { key: 'mobile', label: '모바일' },
  { key: 'android', label: 'Android' },
  { key: 'ios', label: 'iOS' },
]

function nestedLines(options: {
  pluginId?: string
  businessFormId?: string
  destinations?: AlimtalkLinkDestinations
}): AlimtalkNestedLine[] | undefined {
  const lines: AlimtalkNestedLine[] = []
  if (options.pluginId) {
    lines.push({ label: '플러그인 아이디', value: options.pluginId })
  }
  if (options.businessFormId) {
    lines.push({ label: '비즈니스폼 아이디', value: options.businessFormId })
  }
  for (const { key, label } of DESTINATION_LABELS) {
    const value = options.destinations?.[key]
    if (value) lines.push({ label, value })
  }
  return lines.length > 0 ? lines : undefined
}

export function ContentPanel({ template }: ContentPanelProps) {
  return (
    <div className="alimtalk-send-fullpage__content-tables">
      <DetailInfoForm title="템플릿 내용" hideHeader mode="view">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="내용" fullRow view={template.content} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="부가 정보" fullRow view={template.extraInfo || '-'} />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="버튼"
            fullRow
            view={
              <AlimtalkNestedTable
                columns={['버튼 유형', '버튼명']}
                rows={template.buttons.map((button, index) => ({
                  id: `${button.typeLabel}-${index}`,
                  cells: [button.typeLabel, button.name],
                  nestedLines: nestedLines({
                    pluginId: button.pluginId,
                    destinations: button.destinations,
                  }),
                }))}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="바로 연결"
            fullRow
            view={
              <AlimtalkNestedTable
                columns={['바로 연결 유형', '바로 연결명']}
                rows={template.quickLinks.map((link, index) => ({
                  id: `${link.name}-${index}`,
                  cells: [link.typeLabel, link.name],
                  nestedLines: nestedLines({ destinations: link.destinations, businessFormId: link.businessFormId }),
                }))}
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
