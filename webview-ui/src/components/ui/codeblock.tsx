// Inspired by Chatbot-UI and modified to fit the needs of this project
// @see https://github.com/mckaywrigley/chatbot-ui/blob/main/components/Markdown/CodeBlock.tsx

import { FC, memo } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { coldarkDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

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
  return (
    <div>
      <div>
        <span>{language}</span>
        <div></div>
      </div>
      <SyntaxHighlighter
        language={language}
        style={coldarkDark}
        PreTag='div'
        // showLineNumbers
        wrapLines
        lineProps={{style: {wordBreak: 'break-all', whiteSpace: 'pre-wrap'}}}
        customStyle={{
          margin: 0,
          width: 'var(--vscode-workbench-sidebar-defaultWidth)',
          background: 'var(--vscode-editor-background)',
          borderRadius: '0.375rem',
        }}
        codeTagProps={{
          style: {
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
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
