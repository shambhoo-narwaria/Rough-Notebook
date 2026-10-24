import { mount } from 'svelte'
import './theme.css'
import RoughNotebook from './RoughNotebook.svelte'

const saved = localStorage.getItem('leetpad-theme')
const useDark =
  saved === 'dark' || (saved !== 'light' && globalThis.matchMedia('(prefers-color-scheme: dark)').matches)
document.documentElement.classList.toggle('dark', useDark)

const app = mount(RoughNotebook, {
  target: document.getElementById('app')!,
})

export default app
