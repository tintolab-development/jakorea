import type { ReactNode } from 'react'
import { ContentModal, CmsButton } from '@/shared/ui'
import type { PermissionApproveModalKind } from '@/features/user/permission-management/instructor-permission-approve-modal'
import {
  ADMIN_PERMISSION_TAG_LABEL,
  type AdminPermissionTagVariant,
} from '@/features/user/shared/lib/admin-permission-display'

function resolveAdminPermissionPhrase(variant: AdminPermissionTagVariant | undefined): string {
  if (variant === 'partner') return `${ADMIN_PERMISSION_TAG_LABEL.partner} 권한`
  if (variant === 'viewer') return `${ADMIN_PERMISSION_TAG_LABEL.viewer} 권한`
  return `${ADMIN_PERMISSION_TAG_LABEL.manager} 권한`
}

function EmphasisText({ children }: { children: ReactNode }) {
  return <strong style={{ fontWeight: 700, color: 'var(--main-bk, #3d3d3d)' }}>{children}</strong>
}

function SingleApprovedDescription({
  userDisplayName,
  permissionKind,
  approvedPermissionVariant,
}: {
  userDisplayName: string
  permissionKind: PermissionApproveModalKind
  approvedPermissionVariant?: AdminPermissionTagVariant
}) {
  const name = userDisplayName.trim() || '회원'
  const isAdmin = permissionKind === 'admin'
  const adminPermissionPhrase = resolveAdminPermissionPhrase(approvedPermissionVariant)
  return (
    <>
      <span className="fs-16">
        <strong>[{name}]</strong> 님의 {isAdmin ? '관리자' : '강사'} 권한을 승인하였습니다.
      </span>
      <br />
      <span className="fs-16" style={{ fontWeight: 500, color: 'var(--main-bk, #3d3d3d)' }}>
        {isAdmin ? (
          <>
            {name} 님은 지금부터 <EmphasisText>{adminPermissionPhrase}</EmphasisText>으로 JA 관리자
            활동이 가능합니다.
          </>
        ) : (
          `${name} 님은 지금부터 JA 강사단 소속으로 강사 활동이 가능합니다.`
        )}
      </span>
      {!isAdmin ? (
        <>
          <br />
          <span className="fs-16">
            (JA 강사단 및 제미나이 강사단은 프로그램에 따라 특강 강사로도 활동이 가능합니다.)
          </span>
        </>
      ) : null}
    </>
  )
}

function BulkApprovedDescription({
  memberCount,
  permissionKind,
  approvedPermissionVariant,
}: {
  memberCount: number
  permissionKind: PermissionApproveModalKind
  approvedPermissionVariant?: AdminPermissionTagVariant
}) {
  const isAdmin = permissionKind === 'admin'
  const adminPermissionPhrase = resolveAdminPermissionPhrase(approvedPermissionVariant)
  return (
    <>
      <span className="fs-16">
        선택한 <strong>{memberCount}명의 회원</strong>의 {isAdmin ? '관리자' : '강사'} 권한을
        승인하였습니다.
      </span>
      <br />
      <span className="fs-16" style={{ fontWeight: 500, color: 'var(--main-bk, #3d3d3d)' }}>
        {isAdmin ? (
          <>
            해당 회원은 지금부터 <EmphasisText>{adminPermissionPhrase}</EmphasisText>
            으로 JA 관리자 활동이 가능합니다.
          </>
        ) : (
          '해당 회원은 지금부터 JA 강사단 소속으로 강사 활동이 가능합니다.'
        )}
      </span>
      {!isAdmin ? (
        <>
          <br />
          <span className="fs-16">
            (JA 강사단 및 제미나이 강사단은 프로그램에 따라 특강 강사로도 활동이 가능합니다.)
          </span>
        </>
      ) : null}
    </>
  )
}

type InstructorPermissionApprovedCompleteModalBaseProps = {
  open: boolean
  onClose: () => void
  zIndex?: number
  permissionKind?: PermissionApproveModalKind
  approvedPermissionVariant?: AdminPermissionTagVariant
}

export type InstructorPermissionApprovedCompleteModalProps =
  | (InstructorPermissionApprovedCompleteModalBaseProps & {
      variant: 'single'
      userDisplayName: string
    })
  | (InstructorPermissionApprovedCompleteModalBaseProps & {
      variant: 'bulk'
      memberCount: number
    })

export function InstructorPermissionApprovedCompleteModal(
  props: InstructorPermissionApprovedCompleteModalProps
) {
  const {
    open,
    onClose,
    zIndex,
    variant,
    permissionKind = 'instructor',
    approvedPermissionVariant,
  } = props
  const isAdmin = permissionKind === 'admin'

  const description =
    variant === 'single' ? (
      <SingleApprovedDescription
        userDisplayName={props.userDisplayName}
        permissionKind={permissionKind}
        approvedPermissionVariant={approvedPermissionVariant}
      />
    ) : (
      <BulkApprovedDescription
        memberCount={props.memberCount}
        permissionKind={permissionKind}
        approvedPermissionVariant={approvedPermissionVariant}
      />
    )

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title={isAdmin ? '관리자 권한 승인 완료' : '강사 권한 승인 완료'}
      width={600}
      description={description}
      zIndex={zIndex}
      footer={
        <CmsButton variant="secondary" size="medium" type="button" onClick={onClose}>
          확인
        </CmsButton>
      }
    >
      {null}
    </ContentModal>
  )
}
