import { SchoolSearch, type SchoolSearchSelection } from '@/shared/ui'
import { EditableField } from '../fields/editable-field'
import { EditableRow } from '../fields/editable-row'
import { addressLine, institutionTimesLabel } from '../display'
import { useBasicInfoEditing } from '../use-basic-info-editing'
import type { BasicInfoSectionContext } from './types'
import { formatDateDot } from '@/shared/utils'

const INSTITUTION_NAME_SEARCH_WIDTH = 240

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

  /** 학교 검색 선택 시 기관명·소재지를 함께 갱신 (소재지는 시안상 수정 불가 텍스트) */
  const handleSchoolSelect = (selection: SchoolSearchSelection) => {
    if (selection.source === 'neis') {
      onMemberInfoDraftChange?.({
        schoolName: selection.item.schulNm.trim(),
        institutionAddressSearch: selection.item.orgRdnma.trim(),
        institutionAddressDetail: '',
      })
      return
    }
    const univ = selection.item
    onMemberInfoDraftChange?.({
      schoolName: univ.campusName
        ? `${univ.schoolName.trim()} (${univ.campusName.trim()})`
        : univ.schoolName.trim(),
      institutionAddressSearch: univ.address.trim(),
      institutionAddressDetail: '',
    })
  }

  const draftAddressLine = [d?.institutionAddressSearch?.trim(), d?.institutionAddressDetail?.trim()]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <EditableRow type="double">
        <EditableField
          label="기관명"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={<span>{user.schoolInfo?.schoolName ?? '-'}</span>}
          edit={
            /* 시안(15520:103404): 기관명은 학교 검색 필드(h36 · 240) */
            <SchoolSearch
              value={d?.schoolName ?? ''}
              onChange={next => onMemberInfoDraftChange?.({ schoolName: next })}
              onSelect={handleSchoolSelect}
              placeholder="기관명"
              inputSize="small"
              width={INSTITUTION_NAME_SEARCH_WIDTH}
            />
          }
        />
        <EditableField
          label="기관 소재지"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={<span>{addressLine(user)}</span>}
          edit={<span>{draftAddressLine || addressLine(user)}</span>}
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
