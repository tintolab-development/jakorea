import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { useIndividualTeamInfoField } from '@/features/template/ui/form-set/application-form/individual/individual-team-info-form-rhf'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import '@/features/template/ui/form-editor/form-editor.css'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'

const TEAM_MEMBER_COUNT_OPTIONS = [
  ...Array.from({ length: 5 }, (_, index) => ({
    value: String(index + 1),
    label: `${index + 1}명`,
  })),
  { value: 'custom', label: '직접 입력' },
] as const

const TEAM_ROLE_OPTIONS = [
  { value: 'leader', label: '팀장' },
  { value: 'member', label: '팀원' },
] as const

const inlineChoiceStyle = { display: 'flex', flexWrap: 'wrap' as const, gap: 16 }

/** 프로그램 참여자 신청 폼 (개인·팀) — 팀 정보 단락 */
export function ProgramApplicationFormIndividualTeamInfoParagraph() {
  /** 템플릿 관리 시안(13153:437681) — 팀 내 역할 미선택 */
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const [teamName, setTeamName] = useIndividualTeamInfoField<string>(
    'application.individual.teamInfo.teamName',
    ''
  )
  const [memberCountSelect, setMemberCountSelect] = useIndividualTeamInfoField<string>(
    'application.individual.teamInfo.memberCountSelect',
    ''
  )
  const [customMemberCount, setCustomMemberCount] = useIndividualTeamInfoField<string>(
    'application.individual.teamInfo.customMemberCount',
    ''
  )
  const [teamRole, setTeamRole] = useIndividualTeamInfoField<string>(
    'application.individual.teamInfo.teamRole',
    isTemplateManagementScreen ? '' : (TEAM_ROLE_OPTIONS[0]?.value ?? 'leader')
  )

  return (
    <DetailInfoForm title="팀 정보" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="팀 명"
          fullRow
          edit={
            <CmsInput
              inputSize="small"
              width="100%"
              placeholder="팀 명을 입력해 주세요"
              value={teamName}
              onChange={event => setTeamName(event.target.value)}
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="팀 인원 수"
          edit={
            <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
              <CmsSelect
                inputSize="small"
                width={140}
                withAllOption={false}
                placeholder="인원 수"
                value={memberCountSelect === '' ? undefined : memberCountSelect}
                onChange={value => setMemberCountSelect(String(value ?? ''))}
                options={[...TEAM_MEMBER_COUNT_OPTIONS]}
              />
              {memberCountSelect === 'custom' ? (
                <>
                  <DetailInfoForm.InputsSeparator />
                  <CmsNumericInput
                    inputSize="small"
                    mode="integer"
                    width="100%"
                    style={{ flex: '1 1 160px', minWidth: 140 }}
                    placeholder="팀원 수를 입력해 주세요"
                    value={customMemberCount}
                    onValueChange={setCustomMemberCount}
                  />
                </>
              ) : null}
            </div>
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="팀 내 역할"
          edit={
            <CmsRadioGroup
              size="medium"
              value={teamRole === '' ? undefined : teamRole}
              onChange={event => setTeamRole(event.target.value)}
              style={inlineChoiceStyle}
            >
              {TEAM_ROLE_OPTIONS.map(option => (
                <CmsRadio size="medium" key={option.value} value={option.value}>
                  {option.label}
                </CmsRadio>
              ))}
            </CmsRadioGroup>
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
