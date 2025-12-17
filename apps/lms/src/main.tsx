import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './routes'

// Material Design 3 타입스케일 스타일 import
import { styles as typescaleStyles } from '@material/web/typography/md-typescale-styles.js'

// M3 컴포넌트는 각 컴포넌트 파일에서 개별적으로 import하도록 변경

// Material Design 3 타입스케일 스타일 적용
if (document.adoptedStyleSheets && typescaleStyles?.styleSheet) {
  document.adoptedStyleSheets.push(typescaleStyles.styleSheet)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
