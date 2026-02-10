/**
 * 프로그램 상세 페이지 (관리자)
 * - 헤더: 프로그램 타이틀
 * - 해당 프로그램 진행 상태 위젯
 * - 구분선
 * - 4개 탭 (쿼리 파라미터 tab=키 연동, 기본 tab=info): URL에 어떤 탭인지 의미 전달
 */

import { useParams, useNavigate } from 'react-router-dom'
import { Typography, Tabs, Button, Divider, Spin } from 'antd'
import { ProgramDetailProgressWidget } from '@/features/dashboard/ui/program-detail-progress-widget'
import { ProgramDetailInfoTab } from '@/features/program/ui/program-detail-info-tab'
import { useProgramDetail } from './use-program-detail'
import { useProgramDetailTab, TAB_LABELS } from './use-program-detail-tab'
import './program-detail-page.css'

const { Title } = Typography

export function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { program, loading, canWrite, sponsorName, handleLifecycleStatusChange } =
    useProgramDetail(id)
  const { activeTabKey, onTabChange } = useProgramDetailTab()

  if (loading && !program) {
    return (
      <div className="program-detail-page program-detail-page--loading">
        <Spin size="large" />
      </div>
    )
  }

  if (!id || !program) {
    return (
      <div className="program-detail-page">
        <Typography.Text type="secondary">프로그램을 찾을 수 없습니다.</Typography.Text>
        <Button type="link" onClick={() => navigate('/programs')}>
          목록으로
        </Button>
      </div>
    )
  }

  return (
    <div className="program-detail-page">
      <div className="program-detail-page__header">
        <Title level={4} className="program-detail-page__title">
          {program.title}
        </Title>
      </div>

      <ProgramDetailProgressWidget
        programId={program.id}
        currentLifecycleStatus={program.lifecycleStatus ?? undefined}
      />

      <Divider className="program-detail-page__divider" />

      <Tabs
        activeKey={activeTabKey}
        onChange={onTabChange}
        tabBarExtraContent={
          <div className="program-detail-page__tab-actions">
            <Button
              type="primary"
              onClick={() => navigate(`/programs/${id}/edit`)}
              disabled={!canWrite}
            >
              정보 수정
            </Button>
            <Button type="primary" onClick={() => window.open(`/programs/${id}`, '_blank')}>
              프로그램 상세 미리보기
            </Button>
          </div>
        }
        items={[
          {
            key: 'info',
            label: TAB_LABELS.info,
            children: (
              <div className="program-detail-page__tab-content">
                <ProgramDetailInfoTab
                  program={program}
                  sponsorName={sponsorName}
                  lifecycleStatus={program.lifecycleStatus ?? null}
                  onLifecycleStatusChange={handleLifecycleStatusChange}
                />
              </div>
            ),
          },
          {
            key: 'progress',
            label: TAB_LABELS.progress,
            children: <div className="program-detail-page__tab-content" />,
          },
          {
            key: 'applicants',
            label: TAB_LABELS.applicants,
            children: <div className="program-detail-page__tab-content" />,
          },
          {
            key: 'managers',
            label: TAB_LABELS.managers,
            children: <div className="program-detail-page__tab-content" />,
          },
        ]}
      />
    </div>
  )
}

export default ProgramDetailPage
