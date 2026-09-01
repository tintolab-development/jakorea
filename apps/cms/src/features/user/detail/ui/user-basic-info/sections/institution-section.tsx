import { CmsInput } from '@/shared/ui'
import { EditableField } from '../fields/editable-field'
import { EditableRow } from '../fields/editable-row'
import { addressLine, institutionTimesLabel } from '../display'
import { useBasicInfoEditing } from '../use-basic-info-editing'
import { FullWidthAddressEdit } from './shared'
import type { BasicInfoSectionContext } from './types'
import { formatDateDot } from '@/shared/utils'

export function InstitutionSection(ctx: BasicInfoSectionContext) {
  const { user, memberInfoEditing, memberInfoDraft, onMemberInfoDraftChange, cmsMayEditBasicProfileFields } =
    ctx
  const editing = useBasicInfoEditing({
    memberInfoEditing,
    memberInfoDraft,
    onMemberInfoDraftChange,
    cmsMayEditBasicProfileFields,
  })
  const d = memberInfoDraft

  return (
    <>
      <EditableRow type="double">
        <EditableField
          label="기관명"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={<span>{user.schoolInfo?.schoolName ?? '-'}</span>}
          edit={
            <CmsInput
              value={d?.schoolName ?? ''}
              onChange={e => onMemberInfoDraftChange?.({ schoolName: e.target.value })}
              inputSize="medium"
              width="100%"
              aria-label="기관명"
            />
          }
        />
        <EditableField
          label="기관 소재지"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={<span>{addressLine(user)}</span>}
          edit={
            <FullWidthAddressEdit
              searchValue={d?.institutionAddressSearch ?? ''}
              onSearchChange={next => onMemberInfoDraftChange?.({ institutionAddressSearch: next })}
              detailValue={d?.institutionAddressDetail ?? ''}
              onDetailChange={next => onMemberInfoDraftChange?.({ institutionAddressDetail: next })}
              detailAriaLabel="기관 소재지 상세"
            />
          }
        />
      </EditableRow>
      <EditableRow type="double">
        <EditableField
          label="프로그램 신청 횟수"
          readOnlyDisplay
          view={<span>{institutionTimesLabel(user.listMetrics?.institutionProgramApplicationCount)}</span>}
        />
        <EditableField
          label="프로그램 수강 횟수"
          readOnlyDisplay
          view={<span>{institutionTimesLabel(user.listMetrics?.institutionProgramAttendanceCount)}</span>}
        />
      </EditableRow>
      <EditableRow type="single">
        <EditableField label="등록일" readOnlyDisplay view={<span>{formatDateDot(user.createdAt)}</span>} />
      </EditableRow>
    </>
  )
}
