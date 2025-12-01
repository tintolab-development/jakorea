import { useState } from 'react'
import { Button } from '@jakorea/ui'
import { formatDate } from '@jakorea/utils'
import './App.css'

function App() {
  const [waitlist, setWaitlist] = useState(38)
  const [launchDate] = useState(() => new Date('2025-02-14T09:00:00+09:00'))

  return (
    <>
      <h1>JaKorea Platform</h1>
      <div className="card">
        <p>기다리는 사용자: {waitlist}명</p>
        <p>다음 메이저 배포: {formatDate(launchDate, { dateStyle: 'long' })}</p>
        <Button onClick={() => setWaitlist((value) => value + 5)}>
          사전 등록 홍보하기
        </Button>
      </div>
      <p className="read-the-docs">
        Boot the site with <code>pnpm --filter platform dev</code>
      </p>
    </>
  )
}

export default App
