import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { useGeneralApplicationOverlayKv } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import '@/features/template/ui/form-editor/form-editor.css'

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
  const [teamName, setTeamName] = useGeneralApplicationOverlayKv<string>(
    'application.individual.teamInfo.teamName',
    ''
  )
  const [memberCountSelect, setMemberCountSelect] = useGeneralApplicationOverlayKv<string>(
    'application.individual.teamInfo.memberCountSelect',
    ''
  )
  const [customMemberCount, setCustomMemberCount] = useGeneralApplicationOverlayKv<string>(
    'application.individual.teamInfo.customMemberCount',
    ''
  )
  const [teamRole, setTeamRole] = useGeneralApplicationOverlayKv<string>(
    'application.individual.teamInfo.teamRole',
    TEAM_ROLE_OPTIONS[0]?.value ?? 'leader'
  )

  return (
    <DetailInfoForm title="팀 정보" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="팀 명"
          fullRow
          edit={
            <CmsInput
              inputSize="medium"
              width="100%"
              placeholder="팀 명을 입력하세요"
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
                inputSize="medium"
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
                    inputSize="medium"
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
              size="large"
              value={teamRole}
              onChange={event => setTeamRole(event.target.value)}
              style={inlineChoiceStyle}
            >
              {TEAM_ROLE_OPTIONS.map(option => (
                <CmsRadio key={option.value} value={option.value}>
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
