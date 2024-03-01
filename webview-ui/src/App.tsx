import { useState, useEffect } from 'react'
import { createMemoryRouter, RouterProvider, Navigate } from 'react-router-dom'
import { NewChat } from './components/repo/chat-new-chat'
import ChatPage from './pages/chat-page'
import { vscode } from './lib/vscode-utils'
import { SessionContext } from './providers/session-provider'
import type { Session } from './types/session'

import './App.css'
import { usePostHog } from 'posthog-js/react'

export interface AppProps {
  viewType: string
}

function App({ viewType }: AppProps) {
  // console.log("Starting App")

  if (!viewType) return

  const router = createMemoryRouter([
    {
      path: 'repositoryView',
      element: <NewChat />,
    },
    {
      path: 'chatView',
      element: <ChatPage />,
    },
    {
      path: '*',
      element: <Navigate replace to={`/${viewType}`} />,
    },
  ])

  const [session, setSession] = useState<Session | undefined>(undefined)
  const posthog = usePostHog()

  // useEffect(() => {
  // console.log('Navigated to', window.location)
  // }, [window?.location])

  useEffect(() => {
    // write session to extension
    // console.log('Writing session to extension', session)
    if (!session) return
    vscode.postMessage({
      command: 'setSession',
      session,
    })
  }, [session])

  useEffect(() => {
    // console.log('Identifying user', session?.user?.userId)
    if (session?.user?.userId) {
      posthog.identify(session?.user?.userId, {
        email: session?.user?.userId,
        membership:
          session?.user?.membership === 'pro' && session?.user?.business
            ? 'business'
            : session?.user?.membership,
      })
    }
  }, [posthog, session?.user])

  useEffect(() => {
    // console.log('Setting up event listener')
    const eventListener = async (event) => {
      const message = event.data
      switch (message.command) {
        case 'session':
          // console.log('Loaded session from extension', message.value)
          setSession(message.value)
      }
    }

    // listen for response from extension
    window.addEventListener('message', eventListener)

    // console.log('Requesting session from extension')
    // make call to extension
    vscode.postMessage({
      command: 'getSession',
      text: '',
    })

    // unhook listener
    return () => window.removeEventListener('message', eventListener)
  }, [])

  return (
    <SessionContext.Provider value={{ session, setSession }}>
      <RouterProvider router={router} />
    </SessionContext.Provider>
  )
}

export default App
