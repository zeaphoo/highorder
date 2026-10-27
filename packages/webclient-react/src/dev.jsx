import { createRoot } from 'react-dom/client'

import { HighOrderApp } from './index.js'

createRoot(document.getElementById('root')).render(
  <HighOrderApp
    endpoint="http://localhost:8080"
    locale="zh"
    theme="light"
    onEvent={(type, detail) => console.log('[highorder]', type, detail)}
  />,
)
