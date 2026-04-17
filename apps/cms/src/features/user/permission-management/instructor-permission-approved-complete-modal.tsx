import { ContentModal, CmsButton } from '@/shared/ui'
import type { PermissionApproveModalKind } from '@/features/user/permission-management/instructor-permission-approve-modal'

function SingleApprovedDescription({
  userDisplayName,
  permissionKind,
}: {
  userDisplayName: string
  permissionKind: PermissionApproveModalKind
}) {
  const name = userDisplayName.trim() || '회원'
  const isAdmin = permissionKind === 'admin'
  return (
    <>
      <span className="fs-16">
        <strong>[{name}]</strong> 님의 {isAdmin ? '관리자' : '강사'} 권한을 승인하였습니다.
      </span>
      <br />
      <span className="fs-16">
        {isAdmin
          ? `${name} 님은 지금부터 관리자 권한으로 CMS 운영 업무를 수행할 수 있습니다.`
          : `${name} 님은 지금부터 JA 강사단 소속으로 강사 활동이 가능합니다.`}
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
}: {
  memberCount: number
  permissionKind: PermissionApproveModalKind
}) {
  const isAdmin = permissionKind === 'admin'
  return (
    <>
      <span className="fs-16">
        선택한 <strong>{memberCount}명의 회원</strong>의 {isAdmin ? '관리자' : '강사'} 권한을 승인하였습니다.
      </span>
      <br />
      <span className="fs-16">
        {isAdmin
          ? '해당 회원은 지금부터 관리자 권한으로 CMS 운영 업무를 수행할 수 있습니다.'
          : '해당 회원은 지금부터 JA 강사단 소속으로 강사 활동이 가능합니다.'}
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
  const { open, onClose, zIndex, variant, permissionKind = 'instructor' } = props
  const isAdmin = permissionKind === 'admin'

  const description =
    variant === 'single' ? (
      <SingleApprovedDescription userDisplayName={props.userDisplayName} permissionKind={permissionKind} />
    ) : (
      <BulkApprovedDescription memberCount={props.memberCount} permissionKind={permissionKind} />
    )

  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title={isAdmin ? '관리자 권한 승인 완료' : '강사 권한 승인 완료'}
      width={480}
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
