import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { PostHogProvider } from 'posthog-js/react'

const options = {
  api_host: 'https://us.posthog.com',
}

const container = document.getElementById('root')
const root = createRoot(container!)
root.render(
  <React.StrictMode>
    <PostHogProvider apiKey={'phc_qh8L3NKZ4JP6pOLRnuF3UkkUVjmktWW1mR8WfiIvWyi'} options={options}>
      <App viewType={container.getAttribute('viewType')} />
    </PostHogProvider>
  </React.StrictMode>
)
