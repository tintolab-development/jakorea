import type { ReactNode } from 'react'
import type { User } from '@/types/user'
import type { AdminPermissionTagVariant } from '@/features/user/shared/lib/admin-permission-display'
import type { AdminProvisionedMemberBasicInfoDraft } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import {
  BasicInfoLayout,
  BasicInfoSectionTypes,
  type BasicInfoLayoutResolved,
  type InstructorSectionVariant,
} from './user-basic-info-layout-resolver'

export type BasicInfoSectionRenderContext = {
  user: Omit<User, 'password'>
  scheduleChangeCount?: number
  externalId1365?: {
    maskedLabel: string
    fullLabel?: string
    onOpen?: () => void
  } | null
  personalInfoRevealed: boolean
  basicFormMemberEditing: boolean
  memberInfoDraft?: AdminProvisionedMemberBasicInfoDraft | null
  onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
  cmsMayEditBasicProfileFields: boolean
  adminPermissionVariantPatching: boolean
  onPatchAdminPermissionVariantFromDetailView?: (
    nextPermission: AdminPermissionTagVariant
  ) => void | Promise<void>
  adminMemberProfileFieldsEditableWhenEditing: boolean
}

export type BasicInfoSectionRenderers = {
  SchoolTeacherMetaFields: (props: { user: Omit<User, 'password'> }) => ReactNode
  InstructorMetaFields: (props: { user: Omit<User, 'password'> }) => ReactNode
  SchoolTeacherProfileFields: (props: {
    user: Omit<User, 'password'>
    scheduleChangeCount?: number
    personalInfoRevealed: boolean
  }) => ReactNode
  InstructorFieldsByProfile: (props: {
    user: Omit<User, 'password'>
    scheduleChangeCount?: number
    personalInfoRevealed: boolean
    memberInfoEditing?: boolean
    memberInfoDraft?: AdminProvisionedMemberBasicInfoDraft | null
    onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
    cmsMayEditBasicProfileFields: boolean
  }) => ReactNode
  AllUsersFields: (props: {
    user: Omit<User, 'password'>
    scheduleChangeCount?: number
    externalId1365?: {
      maskedLabel: string
      fullLabel?: string
      onOpen?: () => void
    } | null
    personalInfoRevealed: boolean
    memberInfoEditing?: boolean
    memberInfoDraft?: AdminProvisionedMemberBasicInfoDraft | null
    onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
    cmsMayEditBasicProfileFields: boolean
  }) => ReactNode
  InstitutionFields: (props: {
    user: Omit<User, 'password'>
    memberInfoDraft?: AdminProvisionedMemberBasicInfoDraft | null
    onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
    memberInfoEditing?: boolean
    cmsMayEditBasicProfileFields: boolean
  }) => ReactNode
  AdminFields: (props: {
    user: Omit<User, 'password'>
    personalInfoRevealed: boolean
    memberInfoEditing?: boolean
    memberInfoDraft?: AdminProvisionedMemberBasicInfoDraft | null
    onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
    adminPermissionVariantPatching?: boolean
    onPatchAdminPermissionVariantFromDetailView?: (
      nextPermission: AdminPermissionTagVariant
    ) => void | Promise<void>
    adminMemberProfileFieldsEditableWhenEditing?: boolean
  }) => ReactNode
}

function renderMetaSection(
  variant: InstructorSectionVariant,
  user: Omit<User, 'password'>,
  renderers: BasicInfoSectionRenderers
) {
  return variant === 'school_teacher'
    ? renderers.SchoolTeacherMetaFields({ user })
    : renderers.InstructorMetaFields({ user })
}

function renderProfileSection(
  variant: InstructorSectionVariant,
  {
    user,
    scheduleChangeCount,
    personalInfoRevealed,
    basicFormMemberEditing,
    memberInfoDraft,
    onMemberInfoDraftChange,
    cmsMayEditBasicProfileFields,
  }: Pick<
    BasicInfoSectionRenderContext,
    | 'user'
    | 'scheduleChangeCount'
    | 'personalInfoRevealed'
    | 'basicFormMemberEditing'
    | 'memberInfoDraft'
    | 'onMemberInfoDraftChange'
    | 'cmsMayEditBasicProfileFields'
  >,
  renderers: BasicInfoSectionRenderers
) {
  if (variant === 'school_teacher') {
    return renderers.SchoolTeacherProfileFields({
      user,
      scheduleChangeCount,
      personalInfoRevealed,
    })
  }
  return renderers.InstructorFieldsByProfile({
    user,
    scheduleChangeCount,
    personalInfoRevealed,
    memberInfoEditing: basicFormMemberEditing,
    memberInfoDraft,
    onMemberInfoDraftChange,
    cmsMayEditBasicProfileFields,
  })
}

function renderSingleSection(
  section: (typeof BasicInfoSectionTypes)[keyof typeof BasicInfoSectionTypes],
  {
    user,
    scheduleChangeCount,
    externalId1365,
    personalInfoRevealed,
    basicFormMemberEditing,
    memberInfoDraft,
    onMemberInfoDraftChange,
    cmsMayEditBasicProfileFields,
    adminPermissionVariantPatching,
    onPatchAdminPermissionVariantFromDetailView,
    adminMemberProfileFieldsEditableWhenEditing,
  }: BasicInfoSectionRenderContext,
  renderers: BasicInfoSectionRenderers
) {
  if (section === BasicInfoSectionTypes.ALL_USERS) {
    return renderers.AllUsersFields({
      user,
      scheduleChangeCount,
      externalId1365,
      personalInfoRevealed,
      memberInfoEditing: basicFormMemberEditing,
      memberInfoDraft,
      onMemberInfoDraftChange,
      cmsMayEditBasicProfileFields,
    })
  }
  if (section === BasicInfoSectionTypes.INSTITUTION) {
    return renderers.InstitutionFields({
      user,
      memberInfoDraft,
      onMemberInfoDraftChange,
      memberInfoEditing: basicFormMemberEditing,
      cmsMayEditBasicProfileFields,
    })
  }
  return renderers.AdminFields({
    user,
    personalInfoRevealed,
    memberInfoEditing: basicFormMemberEditing,
    memberInfoDraft,
    onMemberInfoDraftChange,
    adminPermissionVariantPatching:
      user.role === 'ADMIN' ? adminPermissionVariantPatching : false,
    onPatchAdminPermissionVariantFromDetailView:
      user.role === 'ADMIN' ? onPatchAdminPermissionVariantFromDetailView : undefined,
    adminMemberProfileFieldsEditableWhenEditing,
  })
}

export function renderResolvedBasicInfoSections({
  resolution,
  shared,
  renderers,
}: {
  resolution: BasicInfoLayoutResolved
  shared: BasicInfoSectionRenderContext
  renderers: BasicInfoSectionRenderers
}) {
  if (resolution.layout === BasicInfoLayout.SPLIT_CARD) {
    const [metaSection, profileSection] = resolution.sections
    return {
      meta:
        metaSection === BasicInfoSectionTypes.META
          ? renderMetaSection(resolution.instructorSectionVariant, shared.user, renderers)
          : null,
      profile:
        profileSection === BasicInfoSectionTypes.PROFILE
          ? renderProfileSection(resolution.instructorSectionVariant, shared, renderers)
          : null,
    }
  }

  const [section] = resolution.sections
  return {
    single: renderSingleSection(section, shared, renderers),
  }
}
