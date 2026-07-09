import { useState } from 'react'
import {
  PfRichTextEditor,
  RichTextViewer,
  useRichTextEditor,
} from '@/shared/rich-text'
import {
  PFAlertModal,
  PFButton,
  PFModal,
  PFPagination,
  PFSearchFilter,
  PFSearchInput,
  PFTabs,
  PFToggle,
  PFText,
  PFTextInput,
} from '@/shared/ui'
import { SearchListLayout } from '@/widgets/search-list-layout'
import styles from './page.module.css'

const tabItems: { key: string; label: string; badge: string }[] = [
  { key: 'tab-1', label: 'tab title', badge: '00' },
  { key: 'tab-2', label: 'tab title', badge: '00' },
  { key: 'tab-3', label: 'tab title', badge: '00' },
]

const pillItems: { key: string; label: string }[] = [
  { key: 'pill-1', label: 'tab title' },
  { key: 'pill-2', label: 'tab title' },
  { key: 'pill-3', label: 'tab title' },
]

const searchFilterOptions = [
  { value: 'all', label: '전체' },
  { value: 'open', label: '검색필터' },
  { value: 'closed', label: '검색필터' },
  { value: 'scheduled', label: '검색필터' },
]

const layoutSortOptions = [
  { key: 'latest', label: '최신순' },
  { key: 'name', label: '이름순' },
  { key: 'deadline', label: '마감일 가까운순' },
] as const

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
  const [underlineIsolatedTab, setUnderlineIsolatedTab] = useState('tab-1')
  const [underlineBorderedTab, setUnderlineBorderedTab] = useState('tab-1')
  const [pillLargeTab, setPillLargeTab] = useState('pill-1')
  const [pillMediumTab, setPillMediumTab] = useState('pill-1')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFilterValue, setSearchFilterValue] = useState('all')
  const [toggleLarge, setToggleLarge] = useState(false)
  const [toggleSmall, setToggleSmall] = useState(true)
  const [toggleText, setToggleText] = useState(false)
  const [layoutSearchQuery, setLayoutSearchQuery] = useState('')
  const [layoutFilterTarget, setLayoutFilterTarget] = useState('all')
  const [layoutFilterStatus, setLayoutFilterStatus] = useState('all')
  const [layoutFilterOrg, setLayoutFilterOrg] = useState('all')
  const [layoutSort, setLayoutSort] = useState<(typeof layoutSortOptions)[number]['key']>('latest')
  const [layoutPage, setLayoutPage] = useState(1)
  const [richTextPreview, setRichTextPreview] = useState('')
  const [richTextHtmlPreview, setRichTextHtmlPreview] = useState('')
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

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
          {buttonVariants.map(variant => (
            <div className={styles['button-row']} key={variant}>
              <PFText as="span" typo="label-md" color="neutral-cool-500">
                {variant}
              </PFText>
              <div className={styles['button-list']}>
                {buttonSizes.map(size => (
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
          {inputSizes.map(size => (
            <div className={styles['input-row']} key={size}>
              <PFText as="span" typo="label-md" color="neutral-cool-500">
                {size}
              </PFText>
              <PFTextInput size={size} label="Label" placeholder="text" required />
              <PFTextInput size={size} label="Label" placeholder="text" defaultValue="text" />
              <PFTextInput size={size} label="Label" placeholder="text" hasIcon />
              <PFTextInput
                size={size}
                label="Label"
                placeholder="text"
                defaultValue="text"
                disabled
              />
              <PFTextInput size={size} label="Label" placeholder="text" defaultValue="text" error />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFSearchInput
        </PFText>
        <div className={styles['search-stack']}>
          <PFSearchInput value={searchQuery} onValueChange={setSearchQuery} />
          <PFSearchInput defaultValue="기업가 정신" />
          <PFSearchInput disabled placeholder="disabled" />
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFSearchFilter
        </PFText>
        <div className={styles['search-stack']}>
          <PFSearchFilter
            label="모집현황"
            options={searchFilterOptions}
            value={searchFilterValue}
            onChange={setSearchFilterValue}
          />
          <PFSearchFilter
            label="모집현황"
            options={searchFilterOptions}
            value="all"
            onChange={() => undefined}
            disabled
          />
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFToggle
        </PFText>
        <div className={styles['toggle-stack']}>
          <PFToggle variant="check-large" checked={toggleLarge} onChange={setToggleLarge}>
            <PFText typo="bd-lg-sb" color="inherit">
              전체 동의하기
            </PFText>
          </PFToggle>
          <PFToggle variant="check-small" checked={toggleSmall} onChange={setToggleSmall}>
            <PFText typo="bd-md-md" color="black">
              서비스 이용약관
            </PFText>
          </PFToggle>
          <PFToggle
            variant="text"
            checked={toggleText}
            onChange={setToggleText}
            offLabel="선택"
            onLabel="필수"
          />
          <PFToggle
            variant="text"
            checked={!toggleText}
            onChange={(checked) => setToggleText(!checked)}
            offLabel="오름차순"
            onLabel="내림차순"
          />
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
              {paginationSizes.map(size => (
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
              {paginationSizes.map(size => (
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

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFTabs
        </PFText>
        <div className={styles['tabs-stack']}>
          <div className={styles['tabs-row']}>
            <PFText as="span" typo="label-md" color="neutral-cool-500">
              underline / isolated
            </PFText>
            <PFTabs
              items={tabItems}
              value={underlineIsolatedTab}
              onChange={setUnderlineIsolatedTab}
              variant="underline"
              underlineStyle="isolated"
            />
          </div>

          <div className={styles['tabs-row']}>
            <PFText as="span" typo="label-md" color="neutral-cool-500">
              underline / bordered
            </PFText>
            <PFTabs
              items={tabItems}
              value={underlineBorderedTab}
              onChange={setUnderlineBorderedTab}
              variant="underline"
              underlineStyle="bordered"
            />
          </div>

          <div className={styles['tabs-row']}>
            <PFText as="span" typo="label-md" color="neutral-cool-500">
              pill / large
            </PFText>
            <PFTabs
              items={pillItems}
              value={pillLargeTab}
              onChange={setPillLargeTab}
              variant="pill"
              size="large"
            />
          </div>

          <div className={styles['tabs-row']}>
            <PFText as="span" typo="label-md" color="neutral-cool-500">
              pill / medium
            </PFText>
            <PFTabs
              items={pillItems}
              value={pillMediumTab}
              onChange={setPillMediumTab}
              variant="pill"
              size="medium"
            />
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          SearchListLayout
        </PFText>
        <SearchListLayout
          search={
            <PFSearchInput value={layoutSearchQuery} onValueChange={setLayoutSearchQuery} />
          }
          filters={
            <>
              <PFSearchFilter
                label="모집대상"
                options={searchFilterOptions}
                value={layoutFilterTarget}
                onChange={setLayoutFilterTarget}
              />
              <PFSearchFilter
                label="모집현황"
                options={searchFilterOptions}
                value={layoutFilterStatus}
                onChange={setLayoutFilterStatus}
              />
              <PFSearchFilter
                label="운영기관"
                options={searchFilterOptions}
                value={layoutFilterOrg}
                onChange={setLayoutFilterOrg}
              />
            </>
          }
          onFilterReset={() => {
            setLayoutFilterTarget('all')
            setLayoutFilterStatus('all')
            setLayoutFilterOrg('all')
          }}
          toolbarTitle="총 32개 프로그램"
          sort={
            <>
              {layoutSortOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={[
                    styles['sort-option'],
                    layoutSort === option.key ? styles['sort-option-active'] : undefined,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setLayoutSort(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </>
          }
          pagination={
            <PFPagination currentPage={layoutPage} totalPages={8} onPageChange={setLayoutPage} />
          }
        >
          <div className={styles['list-slot-placeholder']} />
        </SearchListLayout>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFModal
        </PFText>
        <div className={styles['modal-stack']}>
          <PFButton variant="secondary" onClick={() => setIsModalOpen(true)}>
            PFModal 열기
          </PFButton>
        </div>
      </div>

      <div className={styles.section}>
        <PFText as="div" typo="hl-sm" color="black">
          PFAlertModal
        </PFText>
        <div className={styles['modal-stack']}>
          <PFButton variant="secondary" onClick={() => setIsAlertModalOpen(true)}>
            PFAlertModal 열기
          </PFButton>
        </div>
      </div>

      <PFModal open={isModalOpen} title="모달 제목" onClose={() => setIsModalOpen(false)}>
        <PFText as="p" typo="bd-md-rg" color="neutral-warm-600">
          PFModal은 X 버튼과 자유로운 children 콘텐츠를 가진 작업용 모달입니다.
        </PFText>
      </PFModal>

      <PFAlertModal
        open={isAlertModalOpen}
        title="본인인증을 완료하지 못했어요."
        description="정보를 확인한 뒤 다시 시도해 주세요."
        onConfirm={() => setIsAlertModalOpen(false)}
      />
    </section>
  )
}
