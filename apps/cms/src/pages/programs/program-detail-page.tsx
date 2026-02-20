/**
 * 프로그램 상세 페이지 (관리자)
 * - 헤더: 프로그램 타이틀
 * - 해당 프로그램 진행 상태 위젯
 * - 구분선
 * - 5개 탭 (쿼리 파라미터 tab=키 연동, 기본 tab=info): 알림 발송 탭은 비활성
 * - 정보수정 클릭 시 같은 페이지에서 수정 모드 전환 (수정 취소 / 수정사항 저장)
 */

import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Typography, Tabs, Button, Divider, Spin, message } from 'antd'
import { PageHeader } from '@/shared/ui/page-header'
import { AppButton } from '@/shared/ui/app-button'
import { MESSAGES } from '@/shared/constants'
import { ProgramDetailProgressWidget } from '@/features/dashboard/ui/program-detail-progress-widget'
import { ProgramDetailInfoTab } from '@/features/program/ui/program-detail-info-tab'
import { ProgramProgressTab } from '@/features/program/ui/program-progress-tab'
import { ProgramManagersTab } from '@/features/program/ui/program-managers-tab'
import { ProgramApplicantsTab } from '@/features/program/ui/program-applicants-tab'
import { useProgramDetail } from './use-program-detail'
import { useProgramDetailTab, TAB_LABELS } from './use-program-detail-tab'
import { useEditModeFocusRestore } from './use-edit-mode-focus-restore'
import '@toast-ui/editor/dist/toastui-editor.css'
import './program-detail-page.css'

export function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { program, loading, canWrite, sponsorName, updateProgram } = useProgramDetail(id)
  const { activeTabKey, onTabChange } = useProgramDetailTab()
  const [isEditMode, setIsEditMode] = useState(false)
  const detailTabSaveRef = useRef<{
    triggerSave: () => Promise<void>
    resetToProgram: () => void
  } | null>(null)
  const editModeButtonRef = useRef<HTMLButtonElement | null>(null)
  const infoTabContentRef = useRef<HTMLDivElement | null>(null)

  useEditModeFocusRestore(isEditMode, editModeButtonRef, infoTabContentRef)

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
      <PageHeader title={program.title} />

      <ProgramDetailProgressWidget
        programId={program.id}
        currentLifecycleStatus={program.lifecycleStatus ?? undefined}
      />

      <Divider className="program-detail-page__divider" />

      <Tabs
        activeKey={activeTabKey}
        onChange={onTabChange}
        tabBarExtraContent={
          activeTabKey === 'info' ? (
            <div className="program-detail-page__tab-actions">
              {isEditMode && (
                <AppButton variant="danger" size="large" onClick={() => setIsEditMode(false)}>
                  수정 취소
                </AppButton>
              )}
              <AppButton
                ref={editModeButtonRef}
                variant="primary"
                size="large"
                onClick={
                  isEditMode
                    ? async () => {
                        await detailTabSaveRef.current?.triggerSave()
                      }
                    : () => {
                        detailTabSaveRef.current?.resetToProgram()
                        setIsEditMode(true)
                      }
                }
                disabled={!isEditMode && !canWrite}
              >
                {isEditMode ? '수정사항 저장' : '정보 수정'}
              </AppButton>
              <AppButton
                variant="primary"
                size="large"
                onClick={() => window.open(`/programs/${id}`, '_blank')}
              >
                프로그램 상세 미리보기
              </AppButton>
            </div>
          ) : null
        }
        items={[
          {
            key: 'info',
            label: TAB_LABELS.info,
            children: (
              <div ref={infoTabContentRef} className="program-detail-page__tab-content">
                <ProgramDetailInfoTab
                  ref={detailTabSaveRef}
                  program={program}
                  sponsorName={sponsorName}
                  lifecycleStatus={program.lifecycleStatus ?? null}
                  isEditMode={isEditMode}
                  onCancelEdit={() => setIsEditMode(false)}
                  onSaveEdit={async draft => {
                    if (!id) return
                    try {
                      const { id: _omit, createdAt: _omit2, ...patch } = draft
                      await updateProgram(id, patch)
                      message.success(MESSAGES.success.programUpdated)
                      setIsEditMode(false)
                    } catch {
                      message.error(MESSAGES.error.update)
                    }
                  }}
                />
              </div>
            ),
          },
          {
            key: 'progress',
            label: TAB_LABELS.progress,
            children: (
              <div className="program-detail-page__tab-content">
                {id && <ProgramProgressTab programId={id} />}
              </div>
            ),
          },
          {
            key: 'applicants',
            label: TAB_LABELS.applicants,
            children: (
              <div className="program-detail-page__tab-content">
                {id && <ProgramApplicantsTab programId={id} />}
              </div>
            ),
          },
          {
            key: 'managers',
            label: TAB_LABELS.managers,
            children: (
              <div className="program-detail-page__tab-content">
                {id && <ProgramManagersTab programId={id} />}
              </div>
            ),
          },
          {
            key: 'notification',
            label: '알림 발송',
            disabled: true,
            children: <div className="program-detail-page__tab-content" />,
          },
        ]}
      />
    </div>
  )
}

export default ProgramDetailPage
