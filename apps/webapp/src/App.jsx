import { useState } from 'react'

import { HighOrderApp } from '@highorder/webclient-react'

/**
 * The app shell. It consumes @highorder/webclient-react directly (React prop
 * path), while third-party embeds will consume the same package through
 * <highorder-app> + createElementRenderer() (element path).
 */
export default function App() {
  const [locale, setLocale] = useState('zh')
  const [endpoint, setEndpoint] = useState('')

  return (
    <main className="page">
      <header className="page__header">
        <h1>HighOrder</h1>
        <p>前后端一体的编程语言 — webapp 骨架</p>
      </header>

      <section className="page__controls">
        <label>
          endpoint
          <input
            value={endpoint}
            placeholder="http://localhost:8080"
            onChange={(event) => setEndpoint(event.target.value)}
          />
        </label>
        <label>
          locale
          <select value={locale} onChange={(event) => setLocale(event.target.value)}>
            <option value="zh">zh</option>
            <option value="en">en</option>
          </select>
        </label>
      </section>

      <section className="page__client">
        <HighOrderApp
          endpoint={endpoint}
          locale={locale}
          theme="light"
          onEvent={(type, detail) => console.debug('[webapp]', type, detail)}
        />
      </section>

      <footer className="page__footer">
        React 路径：apps/webapp 直接渲染组件。嵌入路径：<code>&lt;highorder-app&gt;</code> +
        <code>createElementRenderer()</code> 挂到 shadow root。
      </footer>
    </main>
  )
}
