/**
 * 참여자 신청 상세 — 팀 정보 역할 (팀장/팀원) 변경 드롭다운
 */

import { useEffect, useState } from 'react'
import { StatusDropdownCell } from '@/shared/components/status-dropdown-cell'
import { StatusTag } from '@/shared/components/status-tag'
import { getAssignmentTeamRoleTag } from '@/shared/lib/status-tag-specs'
import type { GeneralIndividualApplicantDetail } from '@/features/program/general/model/individual-applicant'
import { updateGeneralIndividualApplicantTeamRole } from '@/features/program/general/model/individual-applicant'
import { ASSIGNMENT_TEAM_ROLE_LABELS } from '@/features/program/general/model/school-detail-types'

/** 시안: 팀장 태그(드롭다운과 동일 공통 태그), 팀원 일반 텍스트 (읽기 전용) */
export function GeneralIndividualTeamRoleView({
  teamRole,
}: {
  teamRole: GeneralIndividualTeamRoleKey
}) {
  if (teamRole === 'leader') {
    return <StatusTag {...getAssignmentTeamRoleTag(teamRole)} />
  }
  return <span>{ASSIGNMENT_TEAM_ROLE_LABELS[teamRole]}</span>
}

export type GeneralIndividualTeamRoleKey = NonNullable<GeneralIndividualApplicantDetail['teamRole']>

const TEAM_ROLE_OPTIONS: readonly GeneralIndividualTeamRoleKey[] = ['leader', 'member']

export function GeneralIndividualTeamRoleDropdown({
  applicantId,
  teamRole,
  canEdit = true,
  onChange,
}: {
  applicantId: string
  teamRole?: GeneralIndividualTeamRoleKey
  canEdit?: boolean
  onChange?: (teamRole: GeneralIndividualTeamRoleKey) => void | Promise<void>
}) {
  const [role, setRole] = useState(teamRole)
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setRole(teamRole)
  }, [applicantId, teamRole])

  if (role == null) {
    return <>-</>
  }

  const handleChange =
    canEdit && onChange != null
      ? async (newRole: GeneralIndividualTeamRoleKey) => {
          if (isSaving) return
          setIsSaving(true)
          try {
            await onChange(newRole)
            setRole(newRole)
          } catch {
            // 상위 원격 저장 핸들러가 오류 안내와 서버값 refetch를 처리한다.
          } finally {
            setIsSaving(false)
          }
        }
      : canEdit
        ? async (newRole: GeneralIndividualTeamRoleKey) => {
            if (isSaving) return
            setIsSaving(true)
            try {
              updateGeneralIndividualApplicantTeamRole(applicantId, newRole)
              setRole(newRole)
            } finally {
              setIsSaving(false)
            }
          }
        : undefined

  return (
    <StatusDropdownCell<GeneralIndividualTeamRoleKey>
      status={role}
      statusOptions={TEAM_ROLE_OPTIONS}
      getTag={getAssignmentTeamRoleTag}
      isItemDisabled={(cur, opt) => cur === opt}
      isUpdating={isSaving}
      onChange={handleChange}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      emptyPlaceholder="-"
    />
  )
}
