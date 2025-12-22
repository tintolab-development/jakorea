/**
 * 신청 관련 비즈니스 로직 헬퍼 함수
 * Phase 2.1: 비즈니스 로직 분리
 */

import type { Application, ApplicationStatus } from '@/types/domain'
import type { MenuProps } from 'antd'
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { schoolService } from '@/entities/school/api/school-service'
import { instructorService } from '@/entities/instructor/api/instructor-service'

/**
 * 신청 주체 이름 조회
 * @param application 신청 정보
 * @returns 주체 이름 또는 '-'
 */
export function getApplicationSubjectName(application: Application): string {
  if (application.subjectType === 'school') {
    return schoolService.getNameById(application.subjectId)
  } else if (application.subjectType === 'instructor') {
    return instructorService.getNameById(application.subjectId)
  }
  return '-'
}

/**
 * 신청 상태 변경 메뉴 아이템 생성
 * @param application 신청 정보
 * @param handlers 핸들러 함수들
 * @returns Ant Design Menu 아이템 배열
 */
export function createApplicationMenuItems(
  application: Application,
  handlers: {
    onView: (application: Application) => void
    onEdit: (application: Application) => void
    onDelete: (application: Application) => void
    onStatusChange: (application: Application, status: ApplicationStatus) => void
  }
): MenuProps['items'] {
  return [
    {
      key: 'view',
      label: '상세 보기',
      icon: <EyeOutlined />,
      onClick: () => handlers.onView(application),
    },
    {
      key: 'edit',
      label: '수정',
      icon: <EditOutlined />,
      onClick: () => handlers.onEdit(application),
    },
    {
      type: 'divider',
    },
    {
      key: 'status-submitted',
      label: '접수로 변경',
      disabled: application.status === 'submitted',
      onClick: () => handlers.onStatusChange(application, 'submitted'),
    },
    {
      key: 'status-reviewing',
      label: '검토로 변경',
      disabled: application.status === 'reviewing',
      onClick: () => handlers.onStatusChange(application, 'reviewing'),
    },
    {
      key: 'status-approved',
      label: '확정으로 변경',
      disabled: application.status === 'approved',
      onClick: () => handlers.onStatusChange(application, 'approved'),
    },
    {
      key: 'status-rejected',
      label: '거절로 변경',
      disabled: application.status === 'rejected',
      onClick: () => handlers.onStatusChange(application, 'rejected'),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: '삭제',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handlers.onDelete(application),
    },
  ]
}

