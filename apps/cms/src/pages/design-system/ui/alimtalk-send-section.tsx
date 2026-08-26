import { useState } from 'react'
import { ALIMTALK_SEND_TEMPLATE_PICKER_MOCK } from '@/features/notifications/model/alimtalk-template/mock'
import type { AlimtalkTemplateItem } from '@/features/notifications/model/alimtalk-template/types'
import { PreviewModal } from '@/features/notifications/ui/alimtalk-template/preview-modal'
import { SendFullpageModal } from '@/features/notifications/ui/alimtalk-send/fullpage-modal'
import { TemplateSelectField } from '@/features/notifications/ui/alimtalk-send/template-select-field'
import {
  TemplateSelectModal,
  TEMPLATE_SELECT_MODAL_PAGE_SIZE,
} from '@/features/notifications/ui/alimtalk-send/template-select-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsCompactPagination } from '@/shared/ui'
import { DsDemo, DsSection } from './section'

const TEMPLATE_PICKER_Z_INDEX = 1100
const TEMPLATE_PREVIEW_Z_INDEX = 1200
const templatePickerTotalPages = Math.ceil(
  ALIMTALK_SEND_TEMPLATE_PICKER_MOCK.length / TEMPLATE_SELECT_MODAL_PAGE_SIZE
)

export function AlimtalkSendSection() {
  const [open, setOpen] = useState(false)
  const [modalPaginationPage, setModalPaginationPage] = useState(1)
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<AlimtalkTemplateItem | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>()

  const handleTemplateUse = (template: AlimtalkTemplateItem) => {
    setSelectedTemplateId(template.id)
    setPreviewTemplate(null)
    setTemplateModalOpen(false)
  }

  const handleTemplateModalClose = () => {
    setPreviewTemplate(null)
    setTemplateModalOpen(false)
  }

  return (
    <DsSection
      id="alimtalk-send"
      title="AlimTalk send fullpage"
      description="알림톡 발송 전용 풀페이지입니다. 템플릿 양식 미리보기 풀페이지와 셸·패딩을 공유하지 않습니다."
    >
      <p className="ds-note">
        SSOT: <code>features/notifications/ui/alimtalk-send</code>. 목록에서는{' '}
        <code>?modal=send</code>로 열고 닫습니다. 캔버스는 뷰포트 폭 100% · padding{' '}
        <code>32px 52px</code> · 단락 gap 32px · 하단 52px 스페이서입니다.
        <br />
        위젯: padding 20px · radius 16px · shadow <code>0 0 16px rgba(0,0,0,0.06)</code> · 제목
        20/700/140%. 1·3번은 <code>DetailInfoForm</code> 표. 4번 버튼·바로 연결은{' '}
        <code>AlimtalkNestedTable</code> (
        <a href="#alimtalk-nested-table">AlimTalk nested table</a>
        ). 제목·휴대폰 상단 정렬. 4번 표는 내부 스크롤 없이 아래로 늘어나고, 풀페이지 본문이
        스크롤됩니다. 표가 짧을 때 내용 영역 최소 높이는 휴대폰과 같은 777px입니다. 좌측 표가
        길면 우측 휴대폰 미리보기는 <code>position: sticky</code>로 본문 스크롤 시 상단에 고정됩니다.
        <br />
        취소는 <code>CmsButton variant=&quot;cancel&quot;</code> large 140×44. 수신자 액션은
        disabled 없이 안내·준비 중 Alert입니다. 기본 설정의 템플릿 필드는 드롭다운 대신{' '}
        <code>TemplateSelectField</code> 팝업(검색·미리보기·사용하기)으로 선택합니다. 트리거는{' '}
        <code>CmsSelect</code> readonly · suffixIcon <code>SearchOutlined</code> 16px{' '}
        <code>#85969D</code>.
        <br />
        <strong>TemplateSelectModal</strong> (<code>template-select-modal</code>): ContentModal
        800px · padding 26/30/34 · 타이틀↔본문 gap 16 (<code>titleBodyGap=&quot;always&quot;</code>
        ). 본문 블록 gap 16 — 검색 ↔ (총 건수+테이블) ↔ 페이지네이션.{' '}
        <strong>총 N건 ↔ 테이블 gap 8</strong>. 총 건수 16/500/150% main-BK opacity 0.6 (
        <code>총 {ALIMTALK_SEND_TEMPLATE_PICKER_MOCK.length}건</code> 형식). 검색은 CmsInput large + 검색 버튼(Enter·클릭 적용). 테이블{' '}
        <code>cms-data-table</code> · 행 54px · 셀 padding 12×20 · 템플릿명·관리 열{' '}
        <strong>가운데 정렬</strong>. 템플릿명 16/500 <code>#3D3D3D</code>. 관리 열 220px · 행
        버튼 80×32 gap 8(미리보기 default / 사용하기 mint). mock은 템플릿 목록(
        {ALIMTALK_SEND_TEMPLATE_PICKER_MOCK.length}건)과 동일 · 페이지당 {TEMPLATE_SELECT_MODAL_PAGE_SIZE}건.
        <br />
        페이지네이션 SSOT: <code>CmsCompactPagination variant=&quot;modal&quot;</code> — prev/next
        26×26 radius 6 · disabled opacity 0.6 · 버튼↔숫자 gap 16. 전체 페이지 수는{' '}
        <code>Math.ceil(필터 결과 건수 / 5)</code>. 숫자 영역{' '}
        <strong>
          <code>1 / {templatePickerTotalPages}</code>
        </strong>{' '}
        (슬래시 앞뒤 공백 한 칸 · 현재 16/700 default-BK · <code>/ 전체</code> 16/700
        disabled-txt). 푸터 닫기 margin-top 16.
        <br />
        템플릿 강조 유형 <code>IMAGE</code>(이미지형): 4번은 표를 분리 — 이미지 첨부(파일 아이콘 +{' '}
        <code>banner_test image.png</code>) 단독 표, 이어서 내용 · 부가 정보 · 버튼(채널 추가 / 웹
        링크 버튼명 + PC·모바일 nested) · 바로 연결(웹 링크 바로연결명). 버튼·바로 연결은 내부{' '}
        <code>AlimtalkNestedTable</code>로 구분. 휴대폰은 헤더 아래 2:1 배너(
        <code>140.5px</code> · <code>align-self stretch</code>). mock <code>tpl-emphasis-image</code>
        · 원본 500px 이상·2:1. TEXT(강조 표기형)는 강조 제목/부제목 표를 내용 표와 분리.{' '}
        <code>ITEM_LIST</code>(아이템 리스트형): 4번 표 분리 — 이미지 첨부·템플릿 헤더 단독 표 · 아이템
        제목/설명/이미지·리스트(요약 tfoot) 표 · 이어서 내용·부가 정보·버튼·바로 연결 표(16px
        gap). 휴대폰은 배너 2:1 + 헤더 16/700 +
        50×50 썸네일 세로 중앙 + 리스트 갭 22px. mock <code>tpl-emphasis-item-list</code>.
      </p>
      <DsDemo label="TemplateSelectField (발송 풀페이지 기본 설정과 동일 트리거)">
        <div style={{ maxWidth: 480, width: '100%' }}>
          <TemplateSelectField
            value={selectedTemplateId}
            templates={ALIMTALK_SEND_TEMPLATE_PICKER_MOCK}
            onSelect={template => setSelectedTemplateId(template.id)}
          />
        </div>
      </DsDemo>
      <DsDemo label={`TemplateSelectModal (단독 — 총 ${ALIMTALK_SEND_TEMPLATE_PICKER_MOCK.length}건 · 테이블 · 페이지네이션)`}>
        <CmsButton
          variant="primary"
          size="large"
          type="button"
          onClick={() => setTemplateModalOpen(true)}
        >
          템플릿 선택 모달 열기
        </CmsButton>
      </DsDemo>
      <DsDemo label={`CmsCompactPagination variant=modal (숫자: 1 / ${templatePickerTotalPages})`}>
        <CmsCompactPagination
          variant="modal"
          currentPage={modalPaginationPage}
          totalPages={templatePickerTotalPages}
          onPageChange={setModalPaginationPage}
          ariaLabel="템플릿 선택 페이지네이션 데모"
        />
      </DsDemo>
      <DsDemo label="SendFullpageModal">
        <CmsButton variant="primary" size="large" type="button" onClick={() => setOpen(true)}>
          알림톡 발송 열기
        </CmsButton>
      </DsDemo>
      {templateModalOpen ? (
        <TemplateSelectModal
          open
          templates={ALIMTALK_SEND_TEMPLATE_PICKER_MOCK}
          onClose={handleTemplateModalClose}
          onPreview={setPreviewTemplate}
          onUse={handleTemplateUse}
          zIndex={TEMPLATE_PICKER_Z_INDEX}
        />
      ) : null}
      <PreviewModal
        open={previewTemplate != null}
        template={previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUse={handleTemplateUse}
        zIndex={TEMPLATE_PREVIEW_Z_INDEX}
      />
      <SendFullpageModal open={open} onClose={() => setOpen(false)} />
    </DsSection>
  )
}
