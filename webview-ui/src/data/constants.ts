type ISampleRepo = {
  repo: string
  shortName: string
  displayName: string
}

export const SAMPLE_REPOS: ISampleRepo[] = [
  {
    repo: 'Significant-Gravitas/Auto-GPT',
    shortName: 'autoGPT',
    displayName: '🤖  autoGPT',
  },
  {
    repo: 'posthog/posthog',
    shortName: 'posthog',
    displayName: '🦔  Posthog',
  },
  {
    repo: 'pallets/flask',
    shortName: 'flask',
    displayName: '🌐  flask',
  },
  {
    repo: 'facebook/react',
    shortName: 'react',
    displayName: '⚛️  React JS',
  },
  {
    repo: 'microsoft/vscode',
    shortName: 'vs-code',
    displayName: '👩‍💻 VS Code',
  },
  {
    repo: 'hwchase17/langchain',
    shortName: 'langchain',
    displayName: '🦜  langchain',
  },
]

export const API_BASE = 'https://api.greptile.com/v1'
