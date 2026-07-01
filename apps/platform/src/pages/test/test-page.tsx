import { useState } from 'react'
import {
  PfRichTextEditor,
  RichTextViewer,
  useRichTextEditor,
} from '@/shared/rich-text'
import { PFButton, PFPagination, PFText, PFTextInput } from '@/shared/ui'
import styles from './test-page.module.css'

const typographyItems = [
  { label: 'page-title', typo: 'page-title' },
  { label: 'hd-lg', typo: 'hd-lg' },
  { label: 'hl-lg', typo: 'hl-lg' },
  { label: 'bd-lg-rg', typo: 'bd-lg-rg' },
  { label: 'bd-md-rg', typo: 'bd-md-rg' },
  { label: 'bd-sm-rg', typo: 'bd-sm-rg' },
  { label: 'caption-rg', typo: 'caption-rg' },
] as const

const colorItems = [
  { label: 'black', color: 'black' },
  { label: 'neutral-cool-500', color: 'neutral-cool-500' },
  { label: 'neutral-cool-600', color: 'neutral-cool-600' },
  { label: 'primary-500', color: 'primary-500' },
  { label: 'primary-700', color: 'primary-700' },
  { label: 'error', color: 'error' },
  { label: 'success', color: 'success' },
  { label: 'gradient-primary-01', color: 'gradient-primary-01' },
] as const

const buttonSizes = ['small', 'medium', 'large', 'xlarge'] as const
const buttonVariants = ['primary', 'secondary', 'tertiary', 'text'] as const
const inputSizes = ['medium', 'large', 'xlarge'] as const
const paginationSizes = ['large', 'small'] as const

export function TestPage() {
  const [numberedPage, setNumberedPage] = useState(1)
  const [compactPage, setCompactPage] = useState(1)
  const [richTextPreview, setRichTextPreview] = useState('')
  const [richTextHtmlPreview, setRichTextHtmlPreview] = useState('')

  const { editor, api } = useRichTextEditor({
    enabled: true,
    initialContent: '**Platform** rich text 데모',
    contentFormat: 'markdown',
    placeholder: '내용을 입력해 주세요.',
  })

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <PFText as="div" typo="hd-lg" color="black">
          Platform Component Test
        </PFText>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          공통 컴포넌트와 스타일 토큰을 확인하기 위한 테스트 페이지입니다.
        </PFText>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PfRichTextEditor
        </PFText>
        <div className={styles['rich-text-demo']}>
          <PfRichTextEditor editor={editor} />
          <div className={styles['rich-text-actions']}>
            <PFButton
              size="medium"
              variant="secondary"
              onClick={() => setRichTextPreview(api?.getMarkdown() ?? '')}
            >
              Markdown 미리보기
            </PFButton>
            <PFButton
              size="medium"
              variant="secondary"
              onClick={() => setRichTextHtmlPreview(api?.getHTML() ?? '')}
            >
              HTML 미리보기
            </PFButton>
          </div>
          {richTextPreview ? (
            <div className={styles['rich-text-preview']}>
              <PFText as="div" typo="label-md" color="neutral-cool-500">
                Markdown 미리보기
              </PFText>
              <RichTextViewer markdown={richTextPreview} maxHeight="240px" />
            </div>
          ) : null}
          {richTextHtmlPreview ? (
            <div className={styles['rich-text-preview']}>
              <PFText as="div" typo="label-md" color="neutral-cool-500">
                HTML 미리보기
              </PFText>
              <pre className={styles['rich-text-html-preview']}>{richTextHtmlPreview}</pre>
            </div>
          ) : null}
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFText Typography
        </PFText>
        <div className={styles.stack}>
          {typographyItems.map(({ label, typo }) => (
            <div className={styles['sample-row']} key={label}>
              <PFText as="span" typo="label-md" color="neutral-cool-500">
                {label}
              </PFText>
              <PFText as="span" typo={typo} color="black">
                JA Korea 사용자 홈페이지 텍스트 샘플
              </PFText>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFText Color
        </PFText>
        <div className={styles['color-grid']}>
          {colorItems.map(({ label, color }) => (
            <div className={styles['color-card']} key={label}>
              <PFText as="span" typo="bd-sm-sb" color={color}>
                {label}
              </PFText>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFButton
        </PFText>
        <div className={styles['button-stack']}>
          {buttonVariants.map((variant) => (
            <div className={styles['button-row']} key={variant}>
              <PFText as="span" typo="label-md" color="neutral-cool-500">
                {variant}
              </PFText>
              <div className={styles['button-list']}>
                {buttonSizes.map((size) => (
                  <PFButton size={size} variant={variant} key={`${variant}-${size}`}>
                    {size}
                  </PFButton>
                ))}
                <PFButton variant={variant} selected>
                  selected
                </PFButton>
                <PFButton variant={variant} disabled>
                  disabled
                </PFButton>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFTextInput
        </PFText>
        <div className={styles['input-stack']}>
          {inputSizes.map((size) => (
            <div className={styles['input-row']} key={size}>
              <PFText as="span" typo="label-md" color="neutral-cool-500">
                {size}
              </PFText>
              <PFTextInput size={size} label="Label" placeholder="text" required />
              <PFTextInput size={size} label="Label" placeholder="text" defaultValue="text" />
              <PFTextInput size={size} label="Label" placeholder="text" hasIcon />
              <PFTextInput size={size} label="Label" placeholder="text" defaultValue="text" disabled />
              <PFTextInput size={size} label="Label" placeholder="text" defaultValue="text" error />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFPagination
        </PFText>
        <div className={styles['pagination-stack']}>
          <div className={styles['pagination-row']}>
            <PFText as="span" typo="label-md" color="neutral-cool-500">
              numbered
            </PFText>
            <div className={styles['pagination-list']}>
              {paginationSizes.map((size) => (
                <PFPagination
                  currentPage={numberedPage}
                  totalPages={8}
                  onPageChange={setNumberedPage}
                  size={size}
                  key={`numbered-${size}`}
                />
              ))}
            </div>
          </div>

          <div className={styles['pagination-row']}>
            <PFText as="span" typo="label-md" color="neutral-cool-500">
              compact
            </PFText>
            <div className={styles['pagination-list']}>
              {paginationSizes.map((size) => (
                <PFPagination
                  currentPage={compactPage}
                  totalPages={8}
                  onPageChange={setCompactPage}
                  variant="compact"
                  size={size}
                  key={`compact-${size}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
