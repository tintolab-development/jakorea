import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_160_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import {
  UJAT_VOLUNTEER_SCHEDULE_ROLE_LABEL,
  UJAT_VOLUNTEER_SCHEDULE_ROLE_ORDER,
  type UjatVolunteerScheduleRole,
} from './assignment-types'

export function UjatVolunteerAssignmentRoleBadge({ role }: { role: UjatVolunteerScheduleRole }) {
  const mod =
    role === 'attendance_manager'
      ? 'ujat-volunteer-assignment-role-badge--attendance-manager'
      : 'ujat-volunteer-assignment-role-badge--none'
  return (
    <span className={`ujat-volunteer-assignment-role-badge ujat-volunteer-assignment-role-badge--static ${mod}`}>
      {UJAT_VOLUNTEER_SCHEDULE_ROLE_LABEL[role]}
    </span>
  )
}

export function UjatVolunteerAssignmentRoleCell({
  role,
  disabled,
  canAssignAttendanceManager = false,
  isOpen,
  onOpenChange,
  onChange,
}: {
  role: UjatVolunteerScheduleRole
  disabled?: boolean
  /** 해당 교육일 ASSIGNED가 아니면 출결 담당 옵션을 숨긴다 */
  canAssignAttendanceManager?: boolean
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onChange: (next: UjatVolunteerScheduleRole) => void
}) {
  if (disabled) {
    return <UjatVolunteerAssignmentRoleBadge role={role} />
  }

  const statusOptions = canAssignAttendanceManager
    ? UJAT_VOLUNTEER_SCHEDULE_ROLE_ORDER
    : (['none'] as const satisfies readonly UjatVolunteerScheduleRole[])

  return (
    <StatusDropdownCell<UjatVolunteerScheduleRole>
      status={role}
      statusOptions={statusOptions}
      renderBadge={status => <UjatVolunteerAssignmentRoleBadge role={status} />}
      isItemDisabled={(current, option) =>
        current === option || (option === 'attendance_manager' && !canAssignAttendanceManager)
      }
      onChange={onChange}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      tagLayout="tag160"
    />
  )
}

export const UJAT_VOLUNTEER_ASSIGNMENT_ROLE_CELL_CLASSNAME = `${STATUS_DROPDOWN_CELL_CLASSNAME} ${STATUS_DROPDOWN_CELL_TAG_160_CLASSNAME}`
