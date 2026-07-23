/**
 * 참여자 신청 상세 — 팀 정보 역할 (팀장/팀원) 변경 드롭다운
 */

import { useEffect, useState } from 'react'
import { StatusDropdownCell } from '@/shared/components/status-dropdown-cell'
import type { GeneralIndividualApplicantDetail } from '@/data/mock/general-individual-applications-mock'
import { updateGeneralIndividualApplicantTeamRole } from '@/data/mock/general-individual-applications-mock'
import { assignmentTeamRoleTagClassName } from '@/features/program/general/lib/assignment-team-role-tag'
import { ASSIGNMENT_TEAM_ROLE_LABELS } from '@/features/program/general/model/school-detail-types'
import '@/features/program/general/ui/assignment-submission-modal.css'

export type GeneralIndividualTeamRoleKey = NonNullable<GeneralIndividualApplicantDetail['teamRole']>

const TEAM_ROLE_OPTIONS: readonly GeneralIndividualTeamRoleKey[] = ['leader', 'member']

export function GeneralIndividualTeamRoleDropdown({
  applicantId,
  teamRole,
}: {
  applicantId: string
  teamRole?: GeneralIndividualTeamRoleKey
}) {
  const [role, setRole] = useState(teamRole)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setRole(teamRole)
  }, [applicantId, teamRole])

  if (role == null) {
    return <>-</>
  }

  return (
    <StatusDropdownCell<GeneralIndividualTeamRoleKey>
      status={role}
      statusOptions={TEAM_ROLE_OPTIONS}
      renderBadge={r => (
        <span className={assignmentTeamRoleTagClassName(r)}>
          {ASSIGNMENT_TEAM_ROLE_LABELS[r]}
        </span>
      )}
      isItemDisabled={(cur, opt) => cur === opt}
      onChange={newRole => {
        setRole(newRole)
        updateGeneralIndividualApplicantTeamRole(applicantId, newRole)
      }}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      emptyPlaceholder="-"
      style={{ width: 132, minWidth: 132, maxWidth: 132 }}
      chrome="hug"
    />
  )
}
