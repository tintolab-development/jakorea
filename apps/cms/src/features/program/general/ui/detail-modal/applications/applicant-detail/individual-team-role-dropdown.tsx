/**
 * 참여자 신청 상세 — 팀 정보 역할 (팀장/팀원) 변경 드롭다운
 */

import { useEffect, useState } from 'react'
import { StatusDropdownCell } from '@/shared/components/status-dropdown-cell'
import type { GeneralIndividualApplicantDetail } from '@/features/program/general/model/individual-applicant'
import { updateGeneralIndividualApplicantTeamRole } from '@/features/program/general/model/individual-applicant'
import { assignmentTeamRoleTagClassName } from '@/features/program/general/lib/assignment-team-role-tag'
import { ASSIGNMENT_TEAM_ROLE_LABELS } from '@/features/program/general/model/school-detail-types'
import '@/features/program/general/ui/assignment-submission-modal.css'

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
      isUpdating={!canEdit || isSaving}
      onChange={async newRole => {
        if (!canEdit || isSaving) return
        setIsSaving(true)
        try {
          if (onChange) {
            await onChange(newRole)
          } else {
            updateGeneralIndividualApplicantTeamRole(applicantId, newRole)
          }
          setRole(newRole)
        } catch {
          // 상위 원격 저장 핸들러가 오류 안내와 서버값 refetch를 처리한다.
        } finally {
          setIsSaving(false)
        }
      }}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      emptyPlaceholder="-"
      tagLayout="tag160"
      style={{ width: 132, minWidth: 132, maxWidth: 132 }}
    />
  )
}
