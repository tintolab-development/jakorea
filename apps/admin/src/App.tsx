import { useState } from "react";
import { Button } from "@jakorea/ui";
import { formatDate, timeSince } from "@jakorea/utils";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const [lastSync] = useState(() => new Date(Date.now() - 1000 * 60 * 42));

  return (
    <>
      <h1>JaKorea Admin</h1>
      <p>
        마지막 동기화: <strong>{formatDate(lastSync)}</strong> (
        {timeSince(lastSync)})
      </p>
      <div className="card" style={{ gap: "1rem" }}>
        <p>검토 대기 중인 신규 프로그램 {count}건</p>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button onClick={() => setCount((value) => value + 1)}>
            승인 예약
          </Button>
          <Button variant="secondary">초안 내역</Button>
        </div>
      </div>
      <p className="read-the-docs">
        Start the workspace with <code>pnpm --filter admin dev</code>
      </p>
    </>
  );
}

export default App;
