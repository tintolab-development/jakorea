/**
 * 양식 테스트 > 테이블 컴포넌트 모음(가로형·세로형)
 * — 폼/목록에 쓰는 테이블 UI를 한곳에 배치·검토하는 용도
 */

import { Typography } from 'antd'
import { TemplateListCard } from '@/features/template/ui/template-list-card'

export function FormTestTableComponentsPage() {
  return (
    <div className="template-form-tab__content">
      <TemplateListCard
        title="테이블 ( 가로형, 세로형 ) 모음"
        description="템플릿·관리 화면에서 사용하는 테이블 컴포넌트를 이곳에 모아둡니다."
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          아래에 공통 Table 컴포넌트를 단계적으로 추가합니다.
        </Typography.Paragraph>
      </TemplateListCard>
    </div>
  )
}

export default FormTestTableComponentsPage
