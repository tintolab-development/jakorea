/**
 * 게시글 상세 공통 (CMS · Admin)
 * - AdminDetailBackLink: 카드 위 `< 목록으로`
 * - AdminDetailMoreMenu: 조회수 옆 ⋮ → 삭제 / 수정 (하단 버튼과 같은 핸들러를 연결)
 */
import moreVertUrl from '../icons/assets/more-vert-30.svg'
import { Dropdown, type MenuProps } from 'antd'
import chevronBackwardUrl from '../icons/assets/chevron-backward-default.svg'
import { joinClassNames } from '../lib/join-class-names.js'
import './admin-post-detail.css'

export interface AdminDetailBackLinkProps {
  onClick: () => void
  label?: string
  className?: string
}

export function AdminDetailBackLink({
  onClick,
  label = '목록으로',
  className,
}: AdminDetailBackLinkProps) {
  return (
    <button
      type="button"
      className={joinClassNames('admin-detail-back-link', className)}
      onClick={onClick}
    >
      <span className="admin-detail-back-link__icon" aria-hidden>
        <img
          className="admin-detail-back-link__icon-img"
          src={chevronBackwardUrl}
          width={20}
          height={20}
          alt=""
        />
      </span>
      <span className="admin-detail-back-link__label">{label}</span>
    </button>
  )
}

export interface AdminDetailMoreMenuProps {
  onEdit: () => void
  onDelete: () => void
  /** 쓰기 권한 없음 등 — 버튼 비활성 */
  disabled?: boolean
  ariaLabel?: string
  className?: string
}

export function AdminDetailMoreMenu({
  onEdit,
  onDelete,
  disabled = false,
  ariaLabel = '더보기',
  className,
}: AdminDetailMoreMenuProps) {
  const items: MenuProps['items'] = [
    { key: 'delete', label: '삭제' },
    { key: 'edit', label: '수정' },
  ]
  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      disabled={disabled}
      overlayClassName="admin-detail-more-menu__overlay"
      menu={{
        items,
        onClick: ({ key, domEvent }) => {
          domEvent.stopPropagation()
          if (key === 'delete') onDelete()
          else if (key === 'edit') onEdit()
        },
      }}
    >
      <button
        type="button"
        className={joinClassNames('admin-detail-more-menu__trigger', className)}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        disabled={disabled}
      >
        <img src={moreVertUrl} width={30} height={30} alt="" aria-hidden draggable={false} />
      </button>
    </Dropdown>
  )
}
