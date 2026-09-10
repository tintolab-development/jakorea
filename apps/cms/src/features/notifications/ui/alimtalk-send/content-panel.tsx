import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { AlimtalkNestedTable, type AlimtalkNestedLine } from '@/shared/ui/alimtalk-nested-table'
import {
  isAlimtalkExtraInfoMessageType,
  type AlimtalkLinkDestinations,
  type AlimtalkTemplateItem,
} from '@/features/notifications/model/alimtalk-template/types'
import './content-panel.css'

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

function ImageAttachmentView({ fileName }: { fileName: string }) {
  return (
    <span className="alimtalk-send-content-panel__file">
      <svg
        className="alimtalk-send-content-panel__file-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 12 17"
        fill="none"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M6.87144 0H1C0.447715 0 0 0.447715 0 1V15.2C0 15.7523 0.447715 16.2 1 16.2H10.8385C11.3907 16.2 11.8385 15.7523 11.8385 15.2V4.78924C11.8385 4.51608 11.7267 4.2548 11.5292 4.06612L7.56216 0.276876C7.37611 0.0991649 7.12872 0 6.87144 0ZM3.30233 4.68554C3.73592 4.68554 4.08741 4.33405 4.08741 3.90046C4.08741 3.46688 3.73592 3.11538 3.30233 3.11538C2.86875 3.11538 2.51725 3.46688 2.51725 3.90046C2.51725 4.33405 2.86875 4.68554 3.30233 4.68554ZM7.53761 4.7746L9.88812 7.90862C10.0859 8.17231 9.89774 8.54862 9.56812 8.54862H2.82622C2.49082 8.54862 2.30435 8.16064 2.51387 7.89874L3.80833 6.28067C3.95726 6.0945 4.23494 6.07913 4.40352 6.2477L4.81826 6.66245C4.98684 6.83103 5.26453 6.81565 5.41346 6.62949L6.90526 4.76473C7.06861 4.56054 7.38072 4.56542 7.53761 4.7746ZM9.23631 11.8133H9.93673C9.84457 11.0973 9.26626 10.5923 8.51284 10.5923C7.6327 10.5923 6.95531 11.2857 6.95531 12.4666C6.95531 13.6172 7.59123 14.3308 8.52666 14.3308C9.36764 14.3308 9.96899 13.7479 9.96899 12.7932V12.3409H8.57735V12.9087H9.30082C9.2916 13.366 9.00821 13.66 8.53127 13.6625C7.99904 13.66 7.66035 13.2253 7.66035 12.4565C7.66035 11.6927 8.01056 11.2631 8.52666 11.2606C8.8907 11.2631 9.14184 11.4717 9.23631 11.8133ZM3.13582 10.6425V13.1801C3.13582 13.5368 2.99066 13.7228 2.7257 13.7228C2.47686 13.7228 2.31558 13.5544 2.31097 13.2655H1.61976C1.61746 13.984 2.08979 14.3308 2.69344 14.3308C3.36392 14.3308 3.82242 13.8861 3.82242 13.1801V10.6425H3.13582ZM4.98437 14.2805H4.29316V10.6425H5.60185C6.35988 10.6425 6.79534 11.1526 6.79534 11.8686C6.79534 12.5947 6.35297 13.0947 5.58342 13.0947H4.98437V14.2805ZM4.98437 11.2606V12.4867H5.47283C5.88295 12.4867 6.0834 12.2354 6.08109 11.8686C6.0834 11.5068 5.88295 11.2631 5.47283 11.2606H4.98437Z"
          fill="#3D3D3D"
        />
      </svg>
      <span className="alimtalk-send-content-panel__file-name">{fileName}</span>
    </span>
  )
}

function ImageAttachmentForm({
  fileName,
  templateHeader,
}: {
  fileName?: string
  templateHeader?: string
}) {
  return (
    <DetailInfoForm title="이미지 첨부" hideHeader mode="view">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="이미지 첨부"
          fullRow
          view={fileName ? <ImageAttachmentView fileName={fileName} /> : '-'}
        />
      </DetailInfoForm.Row>
      {templateHeader !== undefined ? (
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="템플릿 헤더" fullRow view={templateHeader || '-'} />
        </DetailInfoForm.Row>
      ) : null}
    </DetailInfoForm>
  )
}

export function ContentPanel({ template }: ContentPanelProps) {
  const showEmphasis = template.emphasisType === 'TEXT'
  const showImage = template.emphasisType === 'IMAGE'
  const showItemList = template.emphasisType === 'ITEM_LIST'
  const showExtraInfo = isAlimtalkExtraInfoMessageType(template.messageType)

  const contentTable = (
    <DetailInfoForm title="템플릿 내용" hideHeader mode="view">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field label="내용" fullRow view={template.content} />
      </DetailInfoForm.Row>
      {showExtraInfo ? (
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="부가 정보" fullRow view={template.extraInfo || '-'} />
        </DetailInfoForm.Row>
      ) : null}
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
                nestedLines: nestedLines({
                  destinations: link.destinations,
                  businessFormId: link.businessFormId,
                }),
              }))}
            />
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )

  return (
    <div className="alimtalk-send-fullpage__content-tables">
      {showEmphasis ? (
        <DetailInfoForm title="템플릿 강조" hideHeader mode="view">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="템플릿 강조 제목"
              fullRow
              view={template.emphasisTitle || '-'}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="템플릿 강조 부제목"
              fullRow
              view={template.emphasisSubtitle || '-'}
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      ) : null}
      {showImage ? <ImageAttachmentForm fileName={template.imageFileName} /> : null}
      {showItemList ? (
        <ImageAttachmentForm
          fileName={template.imageFileName}
          templateHeader={template.templateHeader}
        />
      ) : null}
      {showItemList ? (
        <DetailInfoForm title="아이템 리스트" hideHeader mode="view">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field label="아이템 제목" fullRow view={template.itemTitle || '-'} />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="아이템 설명"
              fullRow
              view={template.itemDescription || '-'}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="아이템 이미지"
              fullRow
              view={
                template.itemImageFileName ? (
                  <ImageAttachmentView fileName={template.itemImageFileName} />
                ) : (
                  '-'
                )
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="아이템 리스트"
              fullRow
              view={
                <AlimtalkNestedTable
                  hideToggle
                  columns={['아이템명', '아이템 내용']}
                  rows={(template.itemList ?? []).map((item, index) => ({
                    id: `item-${index}`,
                    cells: [item.name, item.content],
                  }))}
                  footer={
                    template.itemSummary
                      ? {
                          label: '요약',
                          cells: [template.itemSummary.name, template.itemSummary.content],
                        }
                      : undefined
                  }
                />
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      ) : null}
      {contentTable}
    </div>
  )
}
