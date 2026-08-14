import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { AlimtalkTemplateItem } from '@/features/notifications/model/alimtalk-template/types'

type ContentPanelProps = {
  template: AlimtalkTemplateItem
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
              <table className="alimtalk-send-fullpage__inner-table">
                <thead>
                  <tr>
                    <th>버튼 유형</th>
                    <th>버튼명</th>
                  </tr>
                </thead>
                <tbody>
                  {template.buttons.map((button, index) => (
                    <tr key={`${button.typeLabel}-${index}`}>
                      <td>{button.typeLabel}</td>
                      <td>{button.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="바로 연결"
            fullRow
            view={
              <table className="alimtalk-send-fullpage__inner-table">
                <thead>
                  <tr>
                    <th>유형</th>
                    <th>바로연결명</th>
                  </tr>
                </thead>
                <tbody>
                  {template.quickLinks.map((link, index) => (
                    <tr key={`${link.name}-${index}`}>
                      <td>{link.typeLabel}</td>
                      <td>{link.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
