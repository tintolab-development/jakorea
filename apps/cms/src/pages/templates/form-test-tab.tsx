import { useState } from 'react'
import { Space, Typography } from 'antd'
import { TemplateListCard } from '@/shared/components/template/template-list-card'
import { CmsButton } from '@/shared/ui/cms-button'
import { FormTestTemplateFullpageModal } from './form-test-template-fullpage-modal'

/**
 * 폼 양식 관리 > 양식 테스트 탭
 * 작성·발급 양식을 실제 입력 흐름으로 검증하는 화면 (추후 연동)
 */
export function FormTestTab() {
  const [formTestModalOpen, setFormTestModalOpen] = useState(false)

  return (
    <>
      <div className="template-form-tab__content">
        <TemplateListCard
          title="양식 테스트"
          description="등록된 작성·발급 양식을 선택해 미리보기 및 입력 테스트를 수행할 수 있습니다."
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              준비 중입니다.
            </Typography.Paragraph>
            <div>
              <CmsButton
                type="button"
                variant="default"
                size="medium"
                onClick={() => setFormTestModalOpen(true)}
              >
                폼 양식 관리
              </CmsButton>
            </div>
          </Space>
        </TemplateListCard>
      </div>

      <FormTestTemplateFullpageModal open={formTestModalOpen} onClose={() => setFormTestModalOpen(false)} />
    </>
  )
}
