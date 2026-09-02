import { SearchOutlined } from '@ant-design/icons'
import { type ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { UjatProgramApplicationVolunteerType } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/paragraph-body'
import {
  UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS,
  useUjatApplicationVolunteerOverlayKv,
} from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-sync'

const GRADE_OPTIONS = [
  { label: '1학년', value: '1' },
  { label: '2학년', value: '2' },
  { label: '3학년', value: '3' },
  { label: '4학년', value: '4' },
  { label: '휴학생', value: 'leave' },
  { label: '졸업유예', value: 'deferred' },
]

const APPLICATION_ROUTE_OTHER_VALUE = 'other'

const APPLICATION_ROUTE_OPTIONS = [
  { label: '인스타그램', value: 'instagram' },
  { label: '학교 안내 및 에브리타임', value: 'school-everytime' },
  { label: '링커리어', value: 'linkareer' },
  { label: '올콘', value: 'allcon' },
  { label: '캠퍼스픽', value: 'campuspick' },
  { label: '기타', value: APPLICATION_ROUTE_OTHER_VALUE },
]

type BasicInfoFieldsProps = {
  applicationType: UjatProgramApplicationVolunteerType
  onApplicationTypeChange: (next: UjatProgramApplicationVolunteerType) => void
}

function UjatProgramApplicationVolunteerBasicInfoFieldRows({
  applicationType,
  onApplicationTypeChange,
}: BasicInfoFieldsProps): ReactNode {
  const [universityName, setUniversityName] = useUjatApplicationVolunteerOverlayKv<string>(
    UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.universityName,
    ''
  )
  const [grade, setGrade] = useUjatApplicationVolunteerOverlayKv<string | undefined>(
    UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.grade,
    undefined
  )
  const [major, setMajor] = useUjatApplicationVolunteerOverlayKv<string>(
    UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.major,
    ''
  )
  const [applicationRoute, setApplicationRoute] = useUjatApplicationVolunteerOverlayKv<
    string | undefined
  >(UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.applicationRoute, undefined)
  const [applicationRouteOther, setApplicationRouteOther] = useUjatApplicationVolunteerOverlayKv<
    string
  >(UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.applicationRouteOther, '')
  const isOtherApplicationRoute = applicationRoute === APPLICATION_ROUTE_OTHER_VALUE

  return (
    <>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="대학교 및 학년"
          edit={
            <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
              <CmsInput
                inputSize="medium"
                width={240}
                placeholder="학교명을 입력해 보세요"
                icon={<SearchOutlined aria-hidden />}
                value={universityName}
                onChange={e => setUniversityName(e.target.value)}
              />
              <DetailInfoForm.InputsSeparator />
              <CmsSelect
                inputSize="medium"
                width={120}
                withAllOption
                placeholder="학년"
                value={grade}
                onChange={v => setGrade(v == null ? undefined : String(v))}
                options={GRADE_OPTIONS}
              />
            </div>
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="대학 전공"
          edit={
            <CmsInput
              inputSize="medium"
              width="100%"
              placeholder="복수전공이나 부전공이 있을 경우, 함께 기재"
              value={major}
              onChange={e => setMajor(e.target.value)}
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="지원 경로"
          edit={
            isOtherApplicationRoute ? (
              <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
                <CmsSelect
                  inputSize="medium"
                  width={160}
                  withAllOption={false}
                  placeholder="선택"
                  value={applicationRoute}
                  onChange={v => setApplicationRoute(v == null ? undefined : String(v))}
                  options={APPLICATION_ROUTE_OPTIONS}
                />
                <DetailInfoForm.InputsSeparator />
                <CmsInput
                  inputSize="medium"
                  width="100%"
                  style={{ flex: '1 1 0', minWidth: 0 }}
                  placeholder="직접 입력"
                  value={applicationRouteOther}
                  onChange={e => setApplicationRouteOther(e.target.value)}
                />
              </div>
            ) : (
              <CmsSelect
                inputSize="medium"
                width="100%"
                withAllOption
                placeholder="선택"
                value={applicationRoute}
                onChange={v => setApplicationRoute(v == null ? undefined : String(v))}
                options={APPLICATION_ROUTE_OPTIONS}
              />
            )
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="지원 형태"
          edit={
            <CmsRadioGroup
              size="large"
              value={applicationType}
              onChange={e =>
                onApplicationTypeChange(e.target.value as UjatProgramApplicationVolunteerType)
              }
              style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}
            >
              <CmsRadio value="new">신규 봉사자</CmsRadio>
              <CmsRadio value="ujat-graduate">UJAT 수료자 봉사자</CmsRadio>
            </CmsRadioGroup>
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </>
  )
}

/** 1365 ID — 단독 DetailInfoForm 격자 */
export function UjatProgramApplicationVolunteer1365IdForm({ className }: { className?: string }) {
  const [id1365, setId1365] = useUjatApplicationVolunteerOverlayKv<string>(
    UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.id1365,
    ''
  )

  return (
    <DetailInfoForm title="1365 ID" hideHeader mode="edit" className={className}>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="1365 ID"
          edit={
            <CmsInput
              inputSize="medium"
              width="100%"
              placeholder="1365 ID"
              value={id1365}
              onChange={e => setId1365(e.target.value)}
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}

/** 대학·지원 경로 등 — DetailInfoForm 격자(1365 ID 제외) */
export function UjatProgramApplicationVolunteerBasicInfoDetailForm({
  applicationType,
  onApplicationTypeChange,
  className,
}: BasicInfoFieldsProps & { className?: string }) {
  return (
    <DetailInfoForm title="기본 정보" hideHeader mode="edit" className={className}>
      <UjatProgramApplicationVolunteerBasicInfoFieldRows
        applicationType={applicationType}
        onApplicationTypeChange={onApplicationTypeChange}
      />
    </DetailInfoForm>
  )
}

/** UJAT 프로그램 봉사자 신청 폼 — 기본 정보(템플릿 편집: 단일 격자) */
export function UjatProgramApplicationVolunteerBasicInfoParagraph({
  applicationType,
  onApplicationTypeChange,
}: BasicInfoFieldsProps) {
  const [id1365, setId1365] = useUjatApplicationVolunteerOverlayKv<string>(
    UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.id1365,
    ''
  )

  return (
    <DetailInfoForm title="기본 정보" hideHeader mode="edit">
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="1365 ID"
          edit={
            <CmsInput
              inputSize="medium"
              width="100%"
              placeholder="1365 ID"
              value={id1365}
              onChange={e => setId1365(e.target.value)}
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
      <UjatProgramApplicationVolunteerBasicInfoFieldRows
        applicationType={applicationType}
        onApplicationTypeChange={onApplicationTypeChange}
      />
    </DetailInfoForm>
  )
}
