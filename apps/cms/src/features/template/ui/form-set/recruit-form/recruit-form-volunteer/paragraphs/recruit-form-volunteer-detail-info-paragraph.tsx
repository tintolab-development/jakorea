import { RecruitDetailInfoParagraph } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-paragraph'

/** 프로그램 봉사자 모집 폼 — 상세 정보 */
export function RecruitFormVolunteerDetailInfoParagraph() {
  return (
    <RecruitDetailInfoParagraph
      wysiwygResetKey="recruit-form-volunteer-extra-body"
      textFields={[
        { label: '프로그램명', placeholder: '프로그램명을 작성하세요', inputType: 'input' },
        { label: '모집 안내', placeholder: '모집 안내를 작성하세요', inputType: 'input' },
        { label: '지원 방법', placeholder: '지원 방법을 작성하세요', inputType: 'input' },
        { label: '기타사항', placeholder: '기타 안내 사항을 작성하세요', inputType: 'textarea' },
      ]}
    />
  )
}

