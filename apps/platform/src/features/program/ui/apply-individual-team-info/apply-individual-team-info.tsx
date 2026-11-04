import {
  PFFormControlCluster,
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFSelect,
  PFTextInput,
} from '@/shared/ui'
import { ApplyFormRadioGroup } from '../apply-form-radio'
import styles from './apply-individual-team-info.module.css'

const TEAM_MEMBER_COUNT_OPTIONS = [
  ...Array.from({ length: 5 }, (_, index) => ({
    value: String(index + 1),
    label: `${index + 1}명`,
  })),
  { value: 'custom', label: '직접 입력' },
]

const TEAM_ROLE_OPTIONS = [
  { value: 'leader', label: '팀장' },
  { value: 'member', label: '팀원' },
] as const

/** CMS `application.individual.teamInfo.*` 와 동일 키 */
export type ApplyIndividualTeamInfoValues = {
  teamName: string
  memberCountSelect: string
  customMemberCount: string
  teamRole: string
}

type ApplyIndividualTeamInfoProps = {
  value: ApplyIndividualTeamInfoValues
  onChange: (next: ApplyIndividualTeamInfoValues) => void
}

export function emptyIndividualTeamInfo(): ApplyIndividualTeamInfoValues {
  return {
    teamName: '',
    memberCountSelect: '',
    customMemberCount: '',
    teamRole: '',
  }
}

export function findIncompleteIndividualTeamInfoMessage(
  values: ApplyIndividualTeamInfoValues
): string | null {
  if (!values.teamName.trim()) return '팀 명을 입력해 주세요.'
  if (!values.memberCountSelect.trim()) return '팀 인원 수를 선택해 주세요.'
  if (values.memberCountSelect === 'custom') {
    const count = Number.parseInt(values.customMemberCount, 10)
    if (!Number.isFinite(count) || count < 1) return '팀원 수를 입력해 주세요.'
  }
  if (!values.teamRole.trim()) return '팀 내 역할을 선택해 주세요.'
  return null
}

export function teamInfoAnswerFromValues(
  values: ApplyIndividualTeamInfoValues
): Record<string, unknown> {
  return {
    teamName: values.teamName.trim(),
    memberCountSelect: values.memberCountSelect,
    customMemberCount: values.customMemberCount.trim(),
    teamRole: values.teamRole,
  }
}

export function teamInfoValuesFromDraftAnswer(
  answer: unknown
): ApplyIndividualTeamInfoValues | null {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return null
  const row = answer as Record<string, unknown>
  const teamName = typeof row.teamName === 'string' ? row.teamName : ''
  const memberCountSelect = typeof row.memberCountSelect === 'string' ? row.memberCountSelect : ''
  const customMemberCount = typeof row.customMemberCount === 'string' ? row.customMemberCount : ''
  const teamRole = typeof row.teamRole === 'string' ? row.teamRole : ''
  if (!teamName && !memberCountSelect) return null
  return { teamName, memberCountSelect, customMemberCount, teamRole }
}

export function ApplyIndividualTeamInfo({ value, onChange }: ApplyIndividualTeamInfoProps) {
  const patch = (partial: Partial<ApplyIndividualTeamInfoValues>) => {
    onChange({ ...value, ...partial })
  }

  return (
    <PFFormFieldTable className={styles.root}>
      <PFFormFieldRow type="single">
        <PFFormField label="팀 명" fullWidth>
          <PFTextInput
            variant="formPage"
            size="large"
            width="100%"
            placeholder="팀 명을 입력해 주세요"
            value={value.teamName}
            onValueChange={next => patch({ teamName: next })}
          />
        </PFFormField>
      </PFFormFieldRow>

      <PFFormFieldRow type="double">
        <PFFormField label="팀 인원 수">
          <PFFormControlCluster>
            <PFSelect
              variant="formPage"
              size="large"
              width={140}
              placeholder="인원 수"
              options={TEAM_MEMBER_COUNT_OPTIONS}
              value={value.memberCountSelect || undefined}
              onValueChange={next => patch({ memberCountSelect: next })}
            />
            {value.memberCountSelect === 'custom' ? (
              <PFTextInput
                variant="formPage"
                size="large"
                width={160}
                inputMode="numeric"
                placeholder="팀원 수를 입력해 주세요"
                value={value.customMemberCount}
                onValueChange={next => patch({ customMemberCount: next.replace(/[^\d]/g, '') })}
              />
            ) : null}
          </PFFormControlCluster>
        </PFFormField>
        <PFFormField label="팀 내 역할">
          <ApplyFormRadioGroup
            name="apply-team-role"
            value={value.teamRole}
            options={TEAM_ROLE_OPTIONS}
            onChange={next => patch({ teamRole: next })}
          />
        </PFFormField>
      </PFFormFieldRow>
    </PFFormFieldTable>
  )
}
