import { useState } from 'react'
import { MAIL_TEMPLATE_ITEM_MOCK } from '@/features/notifications/model/mail-template/mock'
import { FormModal } from '@/features/notifications/ui/mail-template/form-modal'
import { PreviewModal } from '@/features/notifications/ui/mail-template/preview-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { DsDemo, DsSection } from './section'

const SAMPLE = MAIL_TEMPLATE_ITEM_MOCK[1] ?? MAIL_TEMPLATE_ITEM_MOCK[0] ?? null

export function MailTemplateSection() {
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [previewOpen, setPreviewOpen] = useState(false)

  return (
    <DsSection
      id="mail-template"
      title="Mail template form"
      description="메일 템플릿 등록·수정 풀페이지와 미리보기입니다. 알림톡 발송 풀페이지와 셸은 공유하되 본문·우측 위젯은 메일 전용입니다."
    >
      <p className="ds-note">
        SSOT: <code>features/notifications/ui/mail-template</code>. 목록에서 등록/수정으로 엽니다.
        셸은 <code>TealHeaderModal</code> full · <code>hideHeader</code>. 본문 padding{' '}
        <code>32px 52px 52px</code> · 우측 변수 패널 380px · padding 20px · gap 16px.
        <br />
        본문 에디터는 <code>MailVariable</code> atom + <code>extraExtensions</code>. 툴바 gap은{' '}
        <code>--rt-toolbar-gap: 8px</code> (
        <a href="#editor">Rich text editor</a>). 변수 칩은 mint 15/700 · 클릭 시 앞/뒤 커서 · 통째
        삭제만 가능합니다.
        <br />
        첨부는 <code>FileSelectField</code> · 최대 10개 · 30MB · 파일명 45자. 미리보기는{' '}
        미리보기는 <code>PreviewModal</code> ContentModal 1000px · 제목 <code>메일 미리보기</code> ·
        변수는 샘플값으로 치환됩니다.
      </p>
      <DsDemo label="FormModal (등록)">
        <CmsButton
          variant="primary"
          size="large"
          type="button"
          onClick={() => {
            setFormMode('create')
            setFormOpen(true)
          }}
        >
          템플릿 등록 열기
        </CmsButton>
      </DsDemo>
      <DsDemo label="FormModal (수정)">
        <CmsButton
          variant="secondary"
          size="large"
          type="button"
          onClick={() => {
            setFormMode('edit')
            setFormOpen(true)
          }}
        >
          템플릿 수정 열기
        </CmsButton>
      </DsDemo>
      <DsDemo label="PreviewModal">
        <CmsButton
          variant="secondary"
          size="large"
          type="button"
          onClick={() => setPreviewOpen(true)}
        >
          메일 미리보기 열기
        </CmsButton>
      </DsDemo>
      <FormModal
        open={formOpen}
        mode={formMode}
        template={formMode === 'edit' ? SAMPLE : null}
        onClose={() => setFormOpen(false)}
        onSubmit={() => setFormOpen(false)}
        onDelete={() => setFormOpen(false)}
      />
      {SAMPLE ? (
        <PreviewModal
          open={previewOpen}
          subject={SAMPLE.subject}
          bodyHtml={SAMPLE.bodyHtml}
          senderName={SAMPLE.senderName}
          senderEmail={SAMPLE.senderEmail}
          attachments={SAMPLE.attachmentFileNames.map(name => ({ name, sizeBytes: 82 * 1024 }))}
          previewAt={SAMPLE.updatedAt}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
    </DsSection>
  )
}
