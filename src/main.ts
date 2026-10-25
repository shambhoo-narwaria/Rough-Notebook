import { mount } from 'svelte'
import './theme.css'
import RoughNotebook from './RoughNotebook.svelte'

import { applyTheme, getInitialTheme } from './library/theme/theme'

const theme = getInitialTheme()
applyTheme(theme)

const app = mount(RoughNotebook, {
  target: document.getElementById('app')!,
})

export default app
