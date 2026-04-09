import { Checkbox } from 'antd'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsDatePicker } from '@/shared/ui/cms-datepicker'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'

export function BasicInfoCurriculumSection() {
  return (
    <DetailInfoForm title="기본 정보" hideHeader mode="edit">
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="대표 프로그램명 (국문)"
          edit={<CmsInput placeholder="대표 프로그램명을 입력하세요" />}
          view="-"
        />
        <DetailInfoForm.Field
          label="대표 프로그램명 (영문)"
          edit={<CmsInput placeholder="상세 프로그램명을 입력하세요" />}
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="공고용 프로그램명"
          edit={<CmsInput placeholder="모집 시 노출될 프로그램명을 입력하세요" />}
          view="-"
        />
        <DetailInfoForm.Field
          label="세부 프로그램명"
          edit={<CmsInput placeholder="상세 프로그램명을 입력하세요" />}
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="사업 운영 기간"
          edit={
            <div className="detail-info-form-inputs-wrapper">
              <CmsDatePicker placeholder="시작일" style={{ width: '40%' }} />
              <DetailInfoForm.InputsSeparator />
              <CmsDatePicker placeholder="종료일" style={{ width: '40%' }} />
            </div>
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="프로그램 진행 현황"
          edit={<CmsInput placeholder="일정에 따라 진행 현황이 자동으로 반영됩니다." />}
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="참여자 유형"
          edit={<Checkbox.Group options={['개인', '학교/기관', '강사', '봉사자']} />}
          view="-"
        />
        <DetailInfoForm.Field
          label="사업 분야"
          edit={<CmsSelect placeholder="전체" options={[{ value: 'all', label: '전체' }]} />}
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="후원사"
          edit={<CmsSelect placeholder="전체" options={[{ value: 'all', label: '전체' }]} />}
          view="-"
        />
        <DetailInfoForm.Field
          label="후원사 담당자"
          edit={<CmsSelect placeholder="전체" options={[{ value: 'all', label: '전체' }]} />}
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="설문 진행 항목"
          fullRow
          edit={
            <Checkbox.Group
              options={['설문조사', '학생 만족도조사', '교사 만족도조사', '강의평가']}
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="교육 과정"
          edit={<CmsSelect placeholder="전체" options={[{ value: 'all', label: '전체' }]} />}
          view="-"
        />
        <DetailInfoForm.Field
          label="IP Owned"
          edit={<CmsSelect placeholder="전체" options={[{ value: 'all', label: '전체' }]} />}
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="Course Delivered By"
          edit={<CmsSelect placeholder="전체" options={[{ value: 'all', label: '전체' }]} />}
          view="-"
        />
        <DetailInfoForm.Field
          label="Partner Involvement"
          edit={
            <CmsRadio.Group
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
              defaultValue="yes"
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
