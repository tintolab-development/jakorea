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
  isOpen,
  onOpenChange,
  onChange,
}: {
  role: UjatVolunteerScheduleRole
  disabled?: boolean
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onChange: (next: UjatVolunteerScheduleRole) => void
}) {
  if (disabled) {
    return <UjatVolunteerAssignmentRoleBadge role={role} />
  }

  return (
    <StatusDropdownCell<UjatVolunteerScheduleRole>
      status={role}
      statusOptions={UJAT_VOLUNTEER_SCHEDULE_ROLE_ORDER}
      renderBadge={status => <UjatVolunteerAssignmentRoleBadge role={status} />}
      isItemDisabled={(current, option) => current === option}
      onChange={onChange}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      tagLayout="tag160"
    />
  )
}

export const UJAT_VOLUNTEER_ASSIGNMENT_ROLE_CELL_CLASSNAME = `${STATUS_DROPDOWN_CELL_CLASSNAME} ${STATUS_DROPDOWN_CELL_TAG_160_CLASSNAME}`
