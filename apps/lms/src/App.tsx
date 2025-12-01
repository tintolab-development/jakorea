import { useState } from 'react'
import { Button } from '@jakorea/ui'
import { timeSince } from '@jakorea/utils'
import './App.css'

function App() {
  const [enrollments, setEnrollments] = useState(12)
  const [lastCheck] = useState(() => new Date(Date.now() - 1000 * 60 * 5))

  return (
    <>
      <h1>JaKorea LMS</h1>
      <div className="card">
        <p>최근 점검: {timeSince(lastCheck)}</p>
        <p>현재 등록 요청 {enrollments}건</p>
        <Button onClick={() => setEnrollments((value) => value + 1)}>신규 등록 승인</Button>
      </div>
      <p className="read-the-docs">
        Launch locally with <code>pnpm --filter lms dev</code>
      </p>
    </>
  )
}

export default App
