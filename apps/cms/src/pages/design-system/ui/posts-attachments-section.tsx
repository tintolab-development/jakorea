/**
 * Design System — Posts & attachments (Current)
 */

import { useState } from 'react'
import {
  FileSelectField,
  AttachmentDownloadList,
  AttachmentDownloadIcon,
  ReactionEmojiPicker,
  CommentList,
  CommentComposer,
  REACTION_EMOJI_ITEMS,
} from '@/shared/ui'
import { DsDemo, DsSection } from './section'

export function PostsAttachmentsSection() {
  const [fileNames, setFileNames] = useState<string[]>(['sample-guide.pdf'])
  const [comment, setComment] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null)

  return (
    <DsSection
      id="posts-attachments"
      title="Posts & attachments"
      description={
        '프로그램 게시글 축 presentational Current. 등록은 FileSelectField(#forms 교차), ' +
        '상세는 AttachmentDownloadList · CommentList · CommentComposer · ReactionEmojiPicker. ' +
        'PostDetail/Write 모달 셸은 feature Not catalogued.'
      }
    >
      <DsDemo label="FileSelectField (게시글 등록 패턴)">
        <p className="ds-demo__hint">
          폼 섹션에도 있습니다. 게시글 가이드 문구 예시는 아래와 같습니다.
        </p>
        <FileSelectField
          accept=".jpg,.jpeg,.png"
          multiple
          fileNames={fileNames}
          guideLines={[
            '- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.',
            '- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
          ]}
          onFilesChange={files => setFileNames(prev => [...prev, ...files.map(f => f.name)])}
          onRemoveFile={index => setFileNames(prev => prev.filter((_, i) => i !== index))}
        />
      </DsDemo>

      <DsDemo label="AttachmentDownloadList / AttachmentDownloadIcon">
        <div className="ds-demo__stack">
          <AttachmentDownloadIcon size={22} style={{ color: '#3d3d3d' }} />
          <AttachmentDownloadList
            items={[
              { id: '1', fileName: '프로그램-안내.pdf' },
              { id: '2', fileName: '일정표.xlsx' },
            ]}
            onDownload={item => {
              // DS 데모: 실제 다운로드 없음
              void item
            }}
          />
        </div>
      </DsDemo>

      <DsDemo label="ReactionEmojiPicker">
        <div className="ds-demo__stack">
          <ReactionEmojiPicker
            onSelect={index => setSelectedEmoji(prev => (prev === index ? null : index))}
          />
          {selectedEmoji != null ? (
            <p className="ds-demo__hint">
              선택: {REACTION_EMOJI_ITEMS[selectedEmoji].label}{' '}
              <span aria-hidden>{REACTION_EMOJI_ITEMS[selectedEmoji].emoji}</span>
            </p>
          ) : (
            <p className="ds-demo__hint">이모지를 선택해 보세요.</p>
          )}
        </div>
      </DsDemo>

      <DsDemo label="CommentList + CommentComposer">
        <div
          className="ds-demo__posts-comments"
          style={{
            border: '1px solid #d4d4d4',
            borderRadius: 10,
            background: '#fff',
            maxWidth: 640,
          }}
        >
          <CommentList
            items={[
              {
                id: 'c1',
                authorName: '김○○',
                createdAtLabel: '2026년 7월 16일 오전 10:00',
                content: '확인했습니다. 감사합니다.',
              },
            ]}
          />
          <CommentComposer
            value={comment}
            onChange={setComment}
            onSubmit={() => {
              setComment('')
              setSelectedEmoji(null)
              setEmojiOpen(false)
            }}
            emojiPickerOpen={emojiOpen}
            onEmojiToggle={() => setEmojiOpen(prev => !prev)}
            selectedEmojiIndex={selectedEmoji}
            onEmojiSelect={index => {
              setSelectedEmoji(prev => (prev === index ? null : index))
              setEmojiOpen(false)
            }}
          />
        </div>
      </DsDemo>
    </DsSection>
  )
}
