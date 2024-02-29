// Inspired by Chatbot-UI and modified to fit the needs of this project
// @see https://github.com/mckaywrigley/chatbot-ui/blob/main/components/Markdown/CodeBlock.tsx

import { FC, memo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { coldarkDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'

import { useCopyToClipboard } from '../../lib/hooks/use-copy-to-clipboard'

interface Props {
  language: string
  value: string
}

interface languageMap {
  [key: string]: string | undefined
}

export const programmingLanguages: languageMap = {
  'javascript': '.js',
  'python': '.py',
  'java': '.java',
  'c': '.c',
  'cpp': '.cpp',
  'c++': '.cpp',
  'c#': '.cs',
  'ruby': '.rb',
  'php': '.php',
  'swift': '.swift',
  'objective-c': '.m',
  'kotlin': '.kt',
  'typescript': '.ts',
  'go': '.go',
  'perl': '.pl',
  'rust': '.rs',
  'scala': '.scala',
  'haskell': '.hs',
  'lua': '.lua',
  'shell': '.sh',
  'sql': '.sql',
  'html': '.html',
  'css': '.css',
  // add more file extensions here, make sure the key is same as language prop in CodeBlock.tsx component
}

export const generateRandomString = (length: number, lowercase = false) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXY3456789' // excluding similar looking characters like Z, 2, I, 1, O, 0
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return lowercase ? result.toLowerCase() : result
}

const CodeBlock: FC<Props> = memo(({ language, value }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })

  const onCopy = () => {
    if (isCopied) return
    copyToClipboard(value)
  }

  return (
    <div>
      <div className='code-copy'>
        <span className='code-language'>{language}</span>
        <VSCodeButton appearance='icon' aria-label='Copy Code' onClick={onCopy}>
          {isCopied ? (
            <div className='icon codicon codicon-check'></div>
          ) : (
            <div className='icon codicon codicon-copy'></div>
          )}
          <span className='sr-only'>Copy code</span>
        </VSCodeButton>
      </div>
      <SyntaxHighlighter
        language={language}
        style={coldarkDark}
        PreTag='div'
        // showLineNumbers
        wrapLines
        lineProps={{ style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' } }}
        customStyle={{
          margin: 0,
          width: 'var(--vscode-workbench-sidebar-defaultWidth)',
          background: 'var(--vscode-editor-background)',
          borderRadius: '0.375rem',
        }}
        codeTagProps={{
          style: {
            fontSize: 'var(--vscode-editor-font-size)',
            fontFamily: 'var(--vscode-editor-font-family)',
            background: 'transparent',
          },
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  )
})
CodeBlock.displayName = 'CodeBlock'

export { CodeBlock }
