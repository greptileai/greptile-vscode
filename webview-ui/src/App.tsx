import { useState, useEffect } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";

import { NewChat } from "./components/chat-new-chat";
import ChatPage from "./pages/chat-page";
import { vscode } from "./lib/vscode-utils";
import { SessionContext } from "./providers/session-provider";
import type { Session } from "./types/session";

import "./App.css";
import { usePostHog } from "posthog-js/react";

const router = createMemoryRouter([ // cons to this?
  {
    path: "/",
    element: <NewChat />,
  },
  {
    path: "/chat/:owner/:repoName",
    element: <ChatPage />
  }
]);

function App() {
  function handleHowdyClick() {
    vscode.postMessage({
      command: "hello",
      text: "Hey there partner! 🤠",
    });
  }

  const [session, setSession] = useState<Session | undefined>(undefined);
  const posthog = usePostHog();

  useEffect(() => {
    if (session?.user?.userId) {
      posthog.identify(session?.user?.userId, {
        email: session?.user?.userId,
        membership:
          session?.user?.membership === "pro" && session?.user?.business
            ? "business"
            : session?.user?.membership,
      });
    }
  }, [posthog, session?.user])

  useEffect(() => {
    const eventListener = async (event) => {
      const message = event.data;
      switch(message.command) {
          case 'session':
            // console.log(message.value)
            setSession(message.value);
      }
    }

    // listen for response from extension
    window.addEventListener('message', eventListener);

    // make call to extension
    vscode.postMessage({
    command: 'getSession',
    text: ''
    });

    // unhook listener
    return () => window.removeEventListener('message', eventListener)
  }, []);

  return (
    <>
      <SessionContext.Provider value={{session, setSession}}>
        <RouterProvider router={router}/>
      </SessionContext.Provider>
    </>
  );
}

export default App;
