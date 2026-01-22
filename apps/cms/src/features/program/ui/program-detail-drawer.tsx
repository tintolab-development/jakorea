/**
 * 프로그램 상세 Drawer 컴포넌트
 * Phase 2.1: 사이드 패널로 상세 정보 표시 (기획자 요청)
 * Phase 5.1: 사용자 화면 기반 UI 개선 (공통 UI 원칙 적용)
 * 리팩토링: 관심사 분리 - 탭별 서브 컴포넌트 및 커스텀 훅으로 분리
 */

import { useState, useMemo, useEffect } from 'react'
import { Drawer, Tabs, Space, Button, Badge, Modal, Typography, Tag } from 'antd'
import { ApplicationFormModal } from '@/shared/ui/application-form-modal'
import { EditOutlined, DeleteOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons'
import type { Program } from '@/types/domain'
import { sponsorService } from '@/entities/sponsor/api/sponsor-service'
import { schoolService } from '@/entities/school/api/school-service'
import { applicationPathService } from '@/entities/application-path/api/application-path-service'
import { useProgramStore } from '@/features/program/model/program-store'
import { useProgramStatusManager } from '@/features/program/hooks/use-program-status-manager'
import { ApplicationPathForm } from '@/features/application-path/ui/application-path-form'
import { DuplicateApplicationAlert } from '@/shared/ui'
import { domainColorsHex } from '@/shared/constants/colors'
import { mockApplications } from '@/data/mock'
import { useAuthStore } from '@/features/auth/model/auth-store'
import type { ProgramLifecycleStatus } from '@/types/domain'
import { ProgramBasicInfoTab } from './program-basic-info-tab'
import { ProgramRoundsTab } from './program-rounds-tab'
import { ProgramApplicationPathTab } from './program-application-path-tab'
import { ProgramEducationRecordTab } from './program-education-record-tab'
import { useProgramApplication } from '../hooks/use-program-application'
import { useProgramFavorite } from '../hooks/use-program-favorite'
import { useApplicationPathManagement } from '../hooks/use-application-path-management'

const { Text } = Typography


interface ProgramDetailDrawerProps {
  open: boolean
  program: Program | null
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  loading?: boolean
  hideActions?: boolean // 수정/삭제 버튼 숨김 (실적 통계 등 읽기 전용)
}

export function ProgramDetailDrawer({
  open,
  program,
  onClose,
  onEdit,
  onDelete,
  loading,
  hideActions = false,
}: ProgramDetailDrawerProps) {
  const { user } = useAuthStore()
  const { selectedProgram: storeSelectedProgram, setSelectedProgram } = useProgramStore()
  const { loading: statusChangeLoading, changeStatus, rollbackStatus } = useProgramStatusManager()
  const [duplicateAlertOpen, setDuplicateAlertOpen] = useState(false)
  const [applicationModalOpen, setApplicationModalOpen] = useState(false)

  // 관리자만 수정/삭제 가능
  const isAdmin = user?.role === 'ADMIN'
  const showActions = !hideActions && isAdmin
  const favoriteUserId = user?.instructorId || user?.id
  const canFavorite = !!favoriteUserId && !isAdmin

  // prop으로 받은 program이 있으면 store에 동기화
  const displayProgram = storeSelectedProgram || program

  // prop으로 program을 받았을 때 store에도 동기화
  useEffect(() => {
    if (program && program.id !== storeSelectedProgram?.id) {
      setSelectedProgram(program)
    }
  }, [program, storeSelectedProgram, setSelectedProgram])

  // 신청 경로 정보 조회
  const applicationPath = useMemo(() => {
    if (!displayProgram) return undefined
    return displayProgram.applicationPathId
      ? applicationPathService.getByIdSync(displayProgram.applicationPathId)
      : applicationPathService.getByProgramIdSync(displayProgram.id)
  }, [displayProgram])

  // 신청 관련 로직 커스텀 훅
  const {
    applicationInfo,
    userHasApplied,
    capacityInfo,
    applicationCount,
    confirmedRounds,
    checkDuplicate,
  } = useProgramApplication({
    program: displayProgram,
    user,
    applicationPath,
  })

  // 관심 프로그램 로직 커스텀 훅
  const { isFavorite, favoriteLoading, toggleFavorite } = useProgramFavorite({
    open,
    program: displayProgram,
    favoriteUserId,
    canFavorite,
  })

  // 신청 경로 관리 로직 커스텀 훅
  const {
    applicationPathModalOpen,
    editingApplicationPath,
    formLoading,
    handleCreate: handleApplicationPathCreate,
    handleEdit: handleApplicationPathEdit,
    handleSubmit: handleApplicationPathFormSubmit,
    handleCancel: handleApplicationPathFormCancel,
  } = useApplicationPathManagement({
    programId: displayProgram?.id || '',
    isAdmin,
  })

  // 실적 통계 관련: 학교 정보 조회
  const schoolInfo = useMemo(() => {
    if (!displayProgram) return null
    const schoolApp = mockApplications.find(
      app => app.programId === displayProgram.id && app.subjectType === 'school'
    )
    if (schoolApp) {
      const school = schoolService.getByIdSync(schoolApp.subjectId)
      return school ? { name: school.name, region: school.region } : null
    }
    return null
  }, [displayProgram])

  // 스폰서 정보
  const sponsor = useMemo(() => {
    if (!displayProgram) return null
    return sponsorService.getByIdSync(displayProgram.sponsorId)
  }, [displayProgram])

  // 디버깅: 신청하기 버튼 표시 조건 확인
  useEffect(() => {
    if (import.meta.env.DEV && displayProgram) {
      console.log('[신청하기 버튼 디버깅]', {
        programId: displayProgram.id,
        programTitle: displayProgram.title,
        lifecycleStatus: displayProgram.lifecycleStatus,
        applicationAvailable: applicationInfo.applicationAvailable,
        unavailableReason: applicationInfo.unavailableReason,
        hasApplicationPath: !!applicationPath,
        applicationPathId: applicationPath?.id,
        applicationPathIsActive: applicationPath?.isActive,
        applicationPathType: applicationPath?.pathType,
        hasApplicationUrl: !!applicationInfo.applicationUrl,
        applicationUrl: applicationInfo.applicationUrl,
        userHasApplied,
        willShowButton: !!applicationInfo.applicationUrl && !userHasApplied,
      })
    }
  }, [displayProgram, applicationInfo, applicationPath, userHasApplied])

  if (!displayProgram) return null

  // 신청하기 버튼 클릭 핸들러
  const handleApplicationClick = () => {
    // 중복 신청 체크 (강사 권한인 경우에만)
    if (user?.role === 'INSTRUCTOR' && user?.id && displayProgram) {
      const duplicateResult = checkDuplicate(displayProgram, user.id)
      if (duplicateResult.isDuplicate) {
        setDuplicateAlertOpen(true)
        return
      }
    }
    // internal 타입인 경우 모달로 열기
    if (applicationPath?.pathType === 'internal') {
      setApplicationModalOpen(true)
    } else if (applicationPath?.pathType === 'google_form' && applicationInfo.applicationUrl) {
      // 구글폼인 경우 새 창으로 열기
      window.open(applicationInfo.applicationUrl, '_blank')
    }
  }

  return (
    <Drawer
      title={
        <Space align="center">
          <Tag color={domainColorsHex.program.primary} style={{ fontSize: 16, padding: '4px 12px', maxWidth: '400px', display: 'inline-flex', alignItems: 'center' }}>
            <Text ellipsis={{ tooltip: displayProgram.title }} style={{ maxWidth: '350px', display: 'block' }}>
              {displayProgram.title}
            </Text>
          </Tag>
          <Badge status={displayProgram.status === 'active' ? 'success' : 'default'} />
        </Space>
      }
      width={792}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          {canFavorite && (
            <Button
              type="text"
              icon={isFavorite ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
              loading={favoriteLoading}
              onClick={toggleFavorite}
            >
              {isFavorite ? '관심 해제' : '관심 등록'}
            </Button>
          )}
          {showActions && (
            <>
              <Button icon={<EditOutlined />} onClick={onEdit}>
                수정
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={onDelete} loading={loading}>
                삭제
              </Button>
            </>
          )}
        </Space>
      }
    >
      <Tabs
        defaultActiveKey="basic"
        items={[
          {
            key: 'basic',
            label: '기본 정보',
            children: (
              <ProgramBasicInfoTab
                program={displayProgram}
                sponsorName={sponsor?.name}
                confirmedRounds={confirmedRounds}
                applicationInfo={applicationInfo}
                applicationPath={applicationPath || undefined}
                remainingCapacity={capacityInfo.remainingCapacity}
                capacityFull={capacityInfo.capacityFull}
                capacityAlmostFull={capacityInfo.capacityAlmostFull}
                applicationCount={applicationCount}
                userHasApplied={userHasApplied}
                userRole={user?.role}
                onApplicationClick={handleApplicationClick}
                onDuplicateAlertOpen={() => setDuplicateAlertOpen(true)}
                statusChangeLoading={statusChangeLoading}
                onStatusChange={(status: ProgramLifecycleStatus) =>
                  changeStatus(displayProgram.id, status)
                }
                onRollback={() =>
                  rollbackStatus(displayProgram.id, displayProgram.lifecycleStatus)
                }
              />
            ),
          },
          {
            key: 'rounds',
            label: `회차 정보 (${displayProgram.rounds?.length || 0})`,
            children: <ProgramRoundsTab rounds={displayProgram.rounds} />,
          },
          {
            key: 'application-path',
            label: '신청 경로',
            children: (
              <ProgramApplicationPathTab
                applicationPath={applicationPath || undefined}
                isAdmin={isAdmin}
                onEdit={() => applicationPath && handleApplicationPathEdit(applicationPath)}
                onCreate={handleApplicationPathCreate}
              />
            ),
          },
          {
            key: 'education-record',
            label: '실적 통계 상세',
            children: (
              <ProgramEducationRecordTab
                program={displayProgram}
                sponsorNameEn={sponsor?.nameEn}
                schoolInfo={schoolInfo}
              />
            ),
          },
        ]}
      />

      {/* 신청 폼 모달 */}
      {applicationModalOpen && (
        <ApplicationFormModal
          programId={displayProgram.id}
          programTitle={displayProgram.title}
          open={applicationModalOpen}
          onClose={() => setApplicationModalOpen(false)}
          onSuccess={() => {
            setApplicationModalOpen(false)
          }}
        />
      )}

      <Modal
        open={applicationPathModalOpen}
        title={editingApplicationPath ? '신청 경로 수정' : '신청 경로 등록'}
        onCancel={handleApplicationPathFormCancel}
        footer={null}
        width={880}
        destroyOnClose
      >
        <ApplicationPathForm
          path={editingApplicationPath || undefined}
          onSubmit={handleApplicationPathFormSubmit}
          onCancel={handleApplicationPathFormCancel}
          loading={formLoading}
          fixedProgramId={displayProgram.id}
        />
      </Modal>

      {/* 중복 신청 알럿 */}
      {user?.role === 'INSTRUCTOR' && user?.id && displayProgram && (
        <DuplicateApplicationAlert
          open={duplicateAlertOpen}
          program={displayProgram}
          duplicateResult={checkDuplicate(displayProgram, user.id)}
          onConfirm={() => {
            setDuplicateAlertOpen(false)
            // internal 타입인 경우 모달로 열기
            if (applicationPath?.pathType === 'internal') {
              setApplicationModalOpen(true)
            } else if (
              applicationPath?.pathType === 'google_form' &&
              applicationInfo.applicationUrl
            ) {
              // 구글폼인 경우 새 창으로 열기
              window.open(applicationInfo.applicationUrl, '_blank')
            }
          }}
          onCancel={() => {
            setDuplicateAlertOpen(false)
          }}
        />
      )}
    </Drawer>
  )
}

