/**
 * 프로그램 상세 페이지 (관리자)
 * - 헤더: 프로그램 타이틀
 * - 해당 프로그램 진행 상태 위젯
 * - 구분선
 * - 4개 탭 (쿼리 파라미터 tab=키 연동, 기본 tab=info): URL에 어떤 탭인지 의미 전달
 * - 정보수정 클릭 시 같은 페이지에서 수정 모드 전환 (수정 취소 / 수정사항 저장)
 */

import { useState, useRef, useLayoutEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Typography, Tabs, Button, Divider, Spin, message } from 'antd'
import { MESSAGES } from '@/shared/constants'
import { ProgramDetailProgressWidget } from '@/features/dashboard/ui/program-detail-progress-widget'
import { ProgramDetailInfoTab } from '@/features/program/ui/program-detail-info-tab'
import { ProgramProgressTab } from '@/features/program/ui/program-progress-tab'
import { useProgramDetail } from './use-program-detail'
import { useProgramDetailTab, TAB_LABELS } from './use-program-detail-tab'
import '@toast-ui/editor/dist/toastui-editor.css'
import './program-detail-page.css'

const { Title } = Typography

export function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { program, loading, canWrite, sponsorName, handleLifecycleStatusChange, updateProgram } =
    useProgramDetail(id)
  const { activeTabKey, onTabChange } = useProgramDetailTab()
  const [isEditMode, setIsEditMode] = useState(false)
  const detailTabSaveRef = useRef<{
    triggerSave: () => Promise<void>
    resetToProgram: () => void
  } | null>(null)
  const editModeButtonRef = useRef<HTMLButtonElement | null>(null)
  const infoTabContentRef = useRef<HTMLDivElement | null>(null)
  const scrollYRef = useRef(0)

  // 수정 모드 진입 시: 탭 안쪽으로 오토 포커스되는 것 방지 — 포커스가 폼/에디터로 가면 즉시 버튼으로 되돌리고 스크롤 복원
  useLayoutEffect(() => {
    if (!isEditMode) return
    scrollYRef.current = window.scrollY
    const bringBackFocus = () => {
      editModeButtonRef.current?.focus({ preventScroll: true })
      window.scrollTo({ top: scrollYRef.current, left: window.scrollX, behavior: 'auto' })
    }
    bringBackFocus()

    // #region agent log
    const activeEl = document.activeElement
    fetch('http://127.0.0.1:7242/ingest/17f6fbd2-a727-4bc2-b32f-9b76dc9e6837', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'program-detail-page.tsx:useLayoutEffect',
        message: 'edit-mode-entered',
        data: {
          scrollY: window.scrollY,
          scrollYStored: scrollYRef.current,
          activeTag: activeEl?.tagName,
          activeId: (activeEl as HTMLElement)?.id || null,
          activeClass: (activeEl as HTMLElement)?.className?.slice(0, 80) || null,
        },
        timestamp: Date.now(),
        hypothesisId: 'D',
      }),
    }).catch(() => {})
    // #endregion

    const el = infoTabContentRef.current
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (editModeButtonRef.current && el?.contains(target)) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/17f6fbd2-a727-4bc2-b32f-9b76dc9e6837', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'program-detail-page.tsx:onFocusIn',
            message: 'focus-in-tab-content',
            data: {
              tag: target?.tagName,
              id: target?.id || null,
              className: target?.className?.slice(0, 100) || null,
              scrollY: window.scrollY,
              contentEditable: target?.getAttribute?.('contenteditable'),
              role: target?.getAttribute?.('role') || null,
            },
            timestamp: Date.now(),
            hypothesisId: 'A_B_E',
          }),
        }).catch(() => {})
        // #endregion
        bringBackFocus()
      }
    }
    el?.addEventListener('focusin', onFocusIn, true)
    const stop = setTimeout(() => el?.removeEventListener('focusin', onFocusIn, true), 2000)

    const interval = setInterval(bringBackFocus, 100)
    const stopInterval = setTimeout(() => clearInterval(interval), 2000)
    return () => {
      el?.removeEventListener('focusin', onFocusIn, true)
      clearTimeout(stop)
      clearInterval(interval)
      clearTimeout(stopInterval)
    }
  }, [isEditMode])

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
          activeTabKey === 'info' ? (
            <div className="program-detail-page__tab-actions">
              {isEditMode && (
                <Button
                  className="program-detail-page__btn-cancel"
                  onClick={() => setIsEditMode(false)}
                >
                  수정 취소
                </Button>
              )}
              <Button
                ref={editModeButtonRef}
                type="primary"
                className="program-detail-page__btn-primary-teal"
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
              </Button>
              <Button
                className="program-detail-page__btn-primary-teal"
                onClick={() => window.open(`/programs/${id}`, '_blank')}
              >
                프로그램 상세 미리보기
              </Button>
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
                  onLifecycleStatusChange={handleLifecycleStatusChange}
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
