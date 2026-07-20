import searchIcon from '@/assets/images/logo/search_icon.png'

export function FindEmailSearchIcon() {
  return (
    <div className="find-email-search-icon" aria-hidden>
      <img src={searchIcon} alt="" className="find-email-search-icon__image" />
    </div>
  )
}
