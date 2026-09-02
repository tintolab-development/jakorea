import { RecruitDetailInfoParagraph } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-paragraph'

export type ApplicantRecruitDetailInfoParagraphProps = {
  /** 학교·개인 모집 폼 등 템플릿 전환 시 에디터 인스턴스 구분용 */
  wysiwygResetKey?: string
  overlayKeyPrefix?: string
}

/** 프로그램 참여자 모집 폼 — 상세 정보 (`공지사항 등록` Toast UI 에디터 재사용) */
export function ApplicantRecruitDetailInfoParagraph({
  wysiwygResetKey = 'applicant-recruit-institution-extra-body',
  overlayKeyPrefix = 'recruit.detailInfo',
}: ApplicantRecruitDetailInfoParagraphProps = {}) {
  return (
    <RecruitDetailInfoParagraph
      wysiwygResetKey={wysiwygResetKey}
      overlayKeyPrefix={overlayKeyPrefix}
      textFields={[
        { label: '프로그램 설명', placeholder: '프로그램 설명을 작성하세요' },
        { label: '모집 안내', placeholder: '모집 안내를 작성하세요' },
        { label: '지원 방법', placeholder: '지원 방법을 작성하세요' },
        { label: '학습 지원 내용', placeholder: '학습 지원 내용을 작성하세요' },
      ]}
    />
  )
}
