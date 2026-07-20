import { Result } from 'antd'

type ComingSoonTabPanelProps = {
  title?: string
  description?: string
}

export function ComingSoonTabPanel({
  title = '화면 준비중입니다',
  description = '해당 기능은 현재 준비 중입니다. 곧 만나보실 수 있습니다.',
}: ComingSoonTabPanelProps) {
  return (
    <div className="notification-coming-soon-tab-panel">
      <Result status="info" title={title} subTitle={description} />
    </div>
  )
}
