import { defineElement, EVENTS } from './src/index.js'

defineElement()

const app = document.getElementById('a')
const other = document.getElementById('b')
const log = document.getElementById('log')

const print = (line) => {
  log.textContent = `${line}\n${log.textContent}`.trim()
}

for (const type of Object.values(EVENTS)) {
  document.addEventListener(type, (event) => {
    print(`${type} <- #${event.target.id} ${JSON.stringify(event.detail)}`)
  })
}

document.getElementById('theme').addEventListener('click', () => {
  const next = app.options.theme === 'dark' ? 'light' : 'dark'
  app.configure({ theme: next })
})

document.getElementById('locale').addEventListener('click', () => {
  const next = app.options.locale === 'en' ? 'zh' : 'en'
  app.configure({ locale: next })
})

// Demonstrates that instances are independent.
console.log('instances', app.instanceId, other.instanceId)
