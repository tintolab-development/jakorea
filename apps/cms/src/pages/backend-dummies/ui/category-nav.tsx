import { Link } from 'react-router-dom'
import { BACKEND_DUMMY_CATEGORIES } from '../data/categories'
import type { BackendDummyCategoryId } from '../data/types'

export function CategoryNav({ activeId }: { activeId?: BackendDummyCategoryId }) {
  return (
    <nav className="bd-nav" aria-label="프로그램 카테고리">
      <Link to="/backend-dummies" className={!activeId ? 'bd-nav__link bd-nav__link--active' : 'bd-nav__link'}>
        전체
      </Link>
      {BACKEND_DUMMY_CATEGORIES.map(c => (
        <Link
          key={c.id}
          to={`/backend-dummies/${c.id}`}
          className={activeId === c.id ? 'bd-nav__link bd-nav__link--active' : 'bd-nav__link'}
        >
          {c.shortLabel}
        </Link>
      ))}
    </nav>
  )
}
