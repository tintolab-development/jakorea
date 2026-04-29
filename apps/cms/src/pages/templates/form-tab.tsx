import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Space, Typography } from 'antd'
import { TemplateListCard } from '@/features/template/ui/template-list-card'
import { CmsButton } from '@/shared/ui/cms-button'
import { FormTestExplanationFullpageModal } from './form-test-explanation-fullpage-modal'
import { FormTestSingleItemFullpageModal } from './form-test-single-item-fullpage-modal'
import { FormTemplateFullpageModal } from './form-template-fullpage-modal'

const FORM_TEST_TABLES_HREF = '/templates/form-test/tables'

/**
 * 폼 양식 관리 > 양식 테스트 탭
 * 작성·발급 양식을 실제 입력 흐름으로 검증하는 화면 (추후 연동)
 */
export function FormTab() {
  const navigate = useNavigate()
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [singleItemModalOpen, setSingleItemModalOpen] = useState(false)
  const [explanationModalOpen, setExplanationModalOpen] = useState(false)

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
            <CmsButton
              type="button"
              variant="default"
              size="medium"
              width="100%"
              onClick={() => navigate(`${FORM_TEST_TABLES_HREF}?tab=form-test`)}
            >
              테이블 가로형 (임시)
            </CmsButton>
            <CmsButton
              type="button"
              variant="default"
              size="medium"
              width="100%"
              onClick={() => setSingleItemModalOpen(true)}
            >
              단일 항목 모음
            </CmsButton>
            <CmsButton
              type="button"
              variant="default"
              size="medium"
              width="100%"
              onClick={() => setExplanationModalOpen(true)}
            >
              설명글 유형 모음
            </CmsButton>
            <CmsButton
              type="button"
              variant="default"
              size="medium"
              width="100%"
              onClick={() => setFormModalOpen(true)}
            >
              폼 양식 관리
            </CmsButton>
          </Space>
        </TemplateListCard>
      </div>

      <FormTemplateFullpageModal open={formModalOpen} onClose={() => setFormModalOpen(false)} />
      <FormTestSingleItemFullpageModal
        open={singleItemModalOpen}
        onClose={() => setSingleItemModalOpen(false)}
      />
      <FormTestExplanationFullpageModal
        open={explanationModalOpen}
        onClose={() => setExplanationModalOpen(false)}
      />
    </>
  )
}
