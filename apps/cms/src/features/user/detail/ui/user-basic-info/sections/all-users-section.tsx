import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput, CmsSelect } from '@/shared/ui'
import { ScheduleChangeHistoryBadge } from '@/shared/components/schedule-change-history-badge'
import { affiliationView, detailAddressView, genderBirthView } from '../display'
import { useBasicInfoEditing } from '../use-basic-info-editing'
import { EditableField } from '../fields/editable-field'
import { EditableRow } from '../fields/editable-row'
import { NameBlockField } from '../fields/name-block-field'
import { ContactInfoFieldsRow, FullWidthAddressEdit, Id1365View } from './shared'
import {
  GENDER_EDIT_OPTIONS,
  INDIVIDUAL_AFFILIATION_FIELDS_WIDTH,
  individualAffiliationGradeSelectOptions,
} from './constants'
import type { BasicInfoSectionContext } from './types'
import { formatDate } from '@/shared/utils'
import { socialView } from '../display'

export function AllUsersSection(ctx: BasicInfoSectionContext) {
  const {
    user,
    scheduleChangeCount,
    externalId1365,
    personalInfoRevealed,
    memberInfoEditing,
    memberInfoDraft,
    onMemberInfoDraftChange,
    cmsMayEditBasicProfileFields,
  } = ctx
  const editing = useBasicInfoEditing({
    memberInfoEditing,
    memberInfoDraft,
    onMemberInfoDraftChange,
    cmsMayEditBasicProfileFields,
  })
  const d = memberInfoDraft

  return (
    <>
      <NameBlockField
        rows={[
          {
            subLabel: '한글',
            main: editing.canEditBasic ? (
              <span className="user-basic-info-section__name-with-badge">
                <CmsInput
                  value={d?.name ?? ''}
                  onChange={e => onMemberInfoDraftChange?.({ name: e.target.value })}
                  inputSize="medium"
                  width="100%"
                  aria-label="한글 성명"
                />
                {scheduleChangeCount != null && scheduleChangeCount > 0 ? (
                  <ScheduleChangeHistoryBadge count={scheduleChangeCount} />
                ) : null}
              </span>
            ) : (
              <span className="user-basic-info-section__name-with-badge">
                {user.name}
                {scheduleChangeCount != null && scheduleChangeCount > 0 ? (
                  <ScheduleChangeHistoryBadge count={scheduleChangeCount} />
                ) : null}
              </span>
            ),
            sideLabel: '1365 ID',
            side: (
              <Id1365View
                personalInfoRevealed={personalInfoRevealed}
                externalId1365={externalId1365}
              />
            ),
          },
          {
            subLabel: '영문',
            main: editing.canEditBasic ? (
              <CmsInput
                value={d?.nameEn ?? ''}
                onChange={e => onMemberInfoDraftChange?.({ nameEn: e.target.value })}
                inputSize="medium"
                width="100%"
                placeholder="영문 성명"
              />
            ) : (
              <span>{user.nameEn ?? '-'}</span>
            ),
            sideLabel: '성별 및 생년월일',
            side: editing.canEditBasic ? (
              <span className="user-basic-info-section__inline-controls">
                <CmsSelect
                  value={d?.gender || undefined}
                  onChange={v => onMemberInfoDraftChange?.({ gender: v != null ? String(v) : '' })}
                  options={GENDER_EDIT_OPTIONS}
                  placeholder="성별"
                  inputSize="medium"
                  width={120}
                />
                <CmsInput
                  value={d?.birthDate ?? ''}
                  onChange={e => onMemberInfoDraftChange?.({ birthDate: e.target.value })}
                  inputSize="medium"
                  width={160}
                  placeholder="YYYY-MM-DD"
                  aria-label="생년월일"
                />
              </span>
            ) : (
              genderBirthView(user)
            ),
          },
        ]}
      />

      <ContactInfoFieldsRow
        user={user}
        personalInfoRevealed={personalInfoRevealed}
        readOnlyDisplay={editing.isReadOnlyDisplay}
        phoneValue={d?.phone ?? ''}
        emailValue={d?.email ?? ''}
        onPhoneChange={next => onMemberInfoDraftChange?.({ phone: next })}
        onEmailChange={next => onMemberInfoDraftChange?.({ email: next })}
      />

      <EditableRow type="double">
        <EditableField
          label="자택 주소"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={<span>{detailAddressView(user, personalInfoRevealed)}</span>}
          edit={
            <FullWidthAddressEdit
              searchValue={d?.detailAddressSearch ?? ''}
              onSearchChange={next => onMemberInfoDraftChange?.({ detailAddressSearch: next })}
              detailValue={d?.detailAddressDetail ?? ''}
              onDetailChange={next => onMemberInfoDraftChange?.({ detailAddressDetail: next })}
              detailAriaLabel="자택 주소 상세"
            />
          }
        />
        <EditableField
          label="소속"
          readOnlyDisplay={editing.isReadOnlyDisplay}
          view={affiliationView(user)}
          edit={
            <span className="detail-info-form-inputs-wrapper-no-gap">
              <CmsInput
                placeholder="학교명"
                value={d?.affiliationInstitution ?? ''}
                onChange={e => onMemberInfoDraftChange?.({ affiliationInstitution: e.target.value })}
                inputSize="medium"
                width={INDIVIDUAL_AFFILIATION_FIELDS_WIDTH}
                aria-label="소속 기관(학교명)"
              />
              <DetailInfoForm.InputsSeparator />
              <CmsSelect
                placeholder="학년"
                value={d?.affiliationGrade || undefined}
                onChange={v =>
                  onMemberInfoDraftChange?.({ affiliationGrade: v != null ? String(v) : '' })
                }
                options={individualAffiliationGradeSelectOptions(d?.affiliationGrade)}
                inputSize="medium"
                width={INDIVIDUAL_AFFILIATION_FIELDS_WIDTH}
                aria-label="소속 학년"
              />
            </span>
          }
        />
      </EditableRow>

      <EditableRow type="double">
        <EditableField label="가입일" readOnlyDisplay view={<span>{formatDate(user.createdAt)}</span>} />
        <EditableField label="연동된 소셜 계정" readOnlyDisplay view={socialView(user)} />
      </EditableRow>
    </>
  )
}
