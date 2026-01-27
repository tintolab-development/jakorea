/**
 * 권한 커스터마이징 페이지
 * P2: 마스터 관리자 권한 커스터마이징
 */

import { useState, useEffect } from 'react'
import {
  Card,
  Tabs,
  Table,
  Switch,
  Button,
  message,
  Space,
  Typography,
  Alert,
  Modal,
} from 'antd'
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { isMasterAdmin } from '@/shared/utils/permissions'
import {
  fetchPermissionCustomization,
  updateAdminPermissionCustomization,
  updateProgramRolePermissionCustomization,
  resetPermissionCustomizationConfig,
} from '@/entities/permission-customization/api/permission-customization-service'
import type {
  PermissionCustomizationConfig,
  CustomizedAdminPermission,
  CustomizedProgramRolePermission,
} from '@/types/permission-customization'
import type { AdminLevel, ProgramRole } from '@/types/user'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs

// 권한 항목 정의
const ADMIN_PERMISSION_ITEMS = [
  { key: 'canManageUsers', label: '회원 관리', category: 'user' },
  { key: 'canManageSystemSettings', label: '시스템 설정 관리', category: 'system' },
  { key: 'canAccessAllPrograms', label: '모든 프로그램 접근', category: 'program' },
  { key: 'canDeleteUsers', label: '사용자 삭제', category: 'user' },
  { key: 'canApprovePermissionRequests', label: '권한 요청 승인', category: 'system' },
  { key: 'canCreateProgram', label: '프로그램 생성', category: 'program' },
  { key: 'canEditProgram', label: '프로그램 수정', category: 'program' },
  { key: 'canDeleteProgram', label: '프로그램 삭제', category: 'program' },
  { key: 'canDownloadData', label: '데이터 다운로드', category: 'program' },
  { key: 'canManageSettlements', label: '정산 관리', category: 'settlement' },
] as const

const PROGRAM_ROLE_PERMISSION_ITEMS = [
  { key: 'canCreate', label: '생성' },
  { key: 'canUpload', label: '업로드' },
  { key: 'canDownload', label: '다운로드' },
  { key: 'canDelete', label: '삭제' },
  { key: 'canApprove', label: '승인' },
] as const

export function PermissionCustomizationPage() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<PermissionCustomizationConfig | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState<'admin' | 'program'>('admin')

  // 마스터 관리자 권한 체크
  if (!user || !isMasterAdmin(user)) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="접근 권한 없음"
          description="이 페이지는 마스터 관리자만 접근할 수 있습니다."
          type="error"
          showIcon
        />
      </div>
    )
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    setLoading(true)
    try {
      const data = await fetchPermissionCustomization()
      setConfig(data)
      setHasChanges(false)
    } catch (error) {
      message.error('권한 설정을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminPermissionChange = (
    adminLevel: AdminLevel,
    permissionKey: string,
    checked: boolean
  ) => {
    if (!config) return

    const updated = {
      ...config,
      adminPermissions: {
        ...config.adminPermissions,
        [adminLevel]: {
          ...config.adminPermissions[adminLevel],
          permissions: {
            ...config.adminPermissions[adminLevel].permissions,
            [permissionKey]: checked,
          },
        },
      },
    }
    setConfig(updated)
    setHasChanges(true)
  }

  const handleProgramRolePermissionChange = (
    programRole: ProgramRole,
    permissionKey: string,
    checked: boolean
  ) => {
    if (!config) return

    const updated = {
      ...config,
      programRolePermissions: {
        ...config.programRolePermissions,
        [programRole]: {
          ...config.programRolePermissions[programRole],
          permissions: {
            ...config.programRolePermissions[programRole].permissions,
            [permissionKey]: checked,
          },
        },
      },
    }
    setConfig(updated)
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!config || !user) return

    setSaving(true)
    try {
      // 변경된 관리자 권한 저장
      const adminLevels: AdminLevel[] = ['MASTER', 'ADMIN', 'GENERAL']
      for (const adminLevel of adminLevels) {
        const current = config.adminPermissions[adminLevel]
        const original = await fetchPermissionCustomization()
        const originalPerms = original.adminPermissions[adminLevel].permissions

        // 변경사항 확인
        const hasChanges = Object.keys(current.permissions).some(
          key =>
            current.permissions[key as keyof typeof current.permissions] !==
            originalPerms[key as keyof typeof originalPerms]
        )

        if (hasChanges) {
          await updateAdminPermissionCustomization(adminLevel, current.permissions, user.id)
        }
      }

      // 변경된 프로그램 역할 권한 저장
      const programRoles: ProgramRole[] = ['OWNER', 'PARTNER', 'ASSISTANT']
      for (const programRole of programRoles) {
        const current = config.programRolePermissions[programRole]
        const original = await fetchPermissionCustomization()
        const originalPerms = original.programRolePermissions[programRole].permissions

        // 변경사항 확인
        const hasChanges = Object.keys(current.permissions).some(
          key =>
            current.permissions[key as keyof typeof current.permissions] !==
            originalPerms[key as keyof typeof originalPerms]
        )

        if (hasChanges) {
          await updateProgramRolePermissionCustomization(programRole, current.permissions, user.id)
        }
      }

      message.success('권한 설정이 저장되었습니다.')
      setHasChanges(false)
      await loadConfig()
    } catch (error) {
      message.error('권한 설정 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (!user) return

    Modal.confirm({
      title: '권한 설정 초기화',
      content: '모든 권한 설정을 기본값으로 되돌리시겠습니까?',
      onOk: async () => {
        try {
          await resetPermissionCustomizationConfig(user.id)
          message.success('권한 설정이 기본값으로 초기화되었습니다.')
          await loadConfig()
        } catch (error) {
          message.error('권한 설정 초기화에 실패했습니다.')
        }
      },
    })
  }

  if (loading || !config) {
    return <div style={{ padding: 24 }}>로딩 중...</div>
  }

  // 관리자 권한 테이블 컬럼
  const adminPermissionColumns = [
    {
      title: '권한 항목',
      dataIndex: 'label',
      key: 'label',
      width: 200,
    },
    {
      title: '마스터 관리자',
      key: 'MASTER',
      width: 150,
      align: 'center' as const,
      render: (_: any, record: { key: string }) => (
        <Switch
          checked={
            config.adminPermissions.MASTER.permissions[
              record.key as keyof CustomizedAdminPermission['permissions']
            ]
          }
          onChange={checked => handleAdminPermissionChange('MASTER', record.key, checked)}
        />
      ),
    },
    {
      title: '중간 관리자',
      key: 'ADMIN',
      width: 150,
      align: 'center' as const,
      render: (_: any, record: { key: string }) => (
        <Switch
          checked={
            config.adminPermissions.ADMIN.permissions[
              record.key as keyof CustomizedAdminPermission['permissions']
            ]
          }
          onChange={checked => handleAdminPermissionChange('ADMIN', record.key, checked)}
        />
      ),
    },
    {
      title: '일반 관리자',
      key: 'GENERAL',
      width: 150,
      align: 'center' as const,
      render: (_: any, record: { key: string }) => (
        <Switch
          checked={
            config.adminPermissions.GENERAL.permissions[
              record.key as keyof CustomizedAdminPermission['permissions']
            ]
          }
          onChange={checked => handleAdminPermissionChange('GENERAL', record.key, checked)}
        />
      ),
    },
  ]

  // 프로그램 역할 권한 테이블 컬럼
  const programRolePermissionColumns = [
    {
      title: '권한 항목',
      dataIndex: 'label',
      key: 'label',
      width: 200,
    },
    {
      title: '담당자 (OWNER)',
      key: 'OWNER',
      width: 150,
      align: 'center' as const,
      render: (_: any, record: { key: string }) => (
        <Switch
          checked={
            config.programRolePermissions.OWNER.permissions[
              record.key as keyof CustomizedProgramRolePermission['permissions']
            ]
          }
          onChange={checked => handleProgramRolePermissionChange('OWNER', record.key, checked)}
        />
      ),
    },
    {
      title: '파트너 (PARTNER)',
      key: 'PARTNER',
      width: 150,
      align: 'center' as const,
      render: (_: any, record: { key: string }) => (
        <Switch
          checked={
            config.programRolePermissions.PARTNER.permissions[
              record.key as keyof CustomizedProgramRolePermission['permissions']
            ]
          }
          onChange={checked => handleProgramRolePermissionChange('PARTNER', record.key, checked)}
        />
      ),
    },
    {
      title: '보조 (ASSISTANT)',
      key: 'ASSISTANT',
      width: 150,
      align: 'center' as const,
      render: (_: any, record: { key: string }) => (
        <Switch
          checked={
            config.programRolePermissions.ASSISTANT.permissions[
              record.key as keyof CustomizedProgramRolePermission['permissions']
            ]
          }
          onChange={checked => handleProgramRolePermissionChange('ASSISTANT', record.key, checked)}
        />
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2}>권한 설정</Title>
          <Paragraph type="secondary">
            마스터 관리자만 접근 가능한 권한 커스터마이징 설정 페이지입니다.
          </Paragraph>
        </div>

        <Alert
          message="주의사항"
          description="권한 설정 변경은 즉시 적용되며, 모든 관리자에게 영향을 미칩니다. 변경 전 신중히 검토해주세요."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Card
          extra={
            <Space>
              <Button icon={<ReloadOutlined />} onClick={loadConfig}>
                새로고침
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset} danger>
                기본값으로 초기화
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
                disabled={!hasChanges}
              >
                저장
              </Button>
            </Space>
          }
        >
          <Tabs activeKey={activeTab} onChange={key => setActiveTab(key as 'admin' | 'program')}>
            <TabPane tab="관리자 권한" key="admin">
              <Table
                columns={adminPermissionColumns}
                dataSource={ADMIN_PERMISSION_ITEMS.map(item => ({
                  key: item.key,
                  label: item.label,
                }))}
                rowKey="key"
                pagination={false}
                size="middle"
              />
            </TabPane>
            <TabPane tab="프로그램 역할 권한" key="program">
              <Table
                columns={programRolePermissionColumns}
                dataSource={PROGRAM_ROLE_PERMISSION_ITEMS.map(item => ({
                  key: item.key,
                  label: item.label,
                }))}
                rowKey="key"
                pagination={false}
                size="middle"
              />
            </TabPane>
          </Tabs>

          <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
            <Text type="secondary">
              <strong>설정 정보:</strong> 버전 {config.version} | 최종 수정:{' '}
              {new Date(config.updatedAt).toLocaleString('ko-KR')} | 수정자: {config.updatedBy}
            </Text>
          </div>
        </Card>
      </Space>
    </div>
  )
}
