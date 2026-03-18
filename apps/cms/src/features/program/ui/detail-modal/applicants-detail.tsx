import type { TabKey } from './detail-modal-sidebar'

export interface ApplicantDetailsProps {
  menu: TabKey | ''
}

export function ApplicantDetails({ menu }: ApplicantDetailsProps) {
  return (
    <>
      {menu === 'participants' && <div>participants</div>}
      {menu === 'instructors' && <div>instructors</div>}
      {menu === 'volunteers' && <div>volunteers</div>}
    </>
  )
}
