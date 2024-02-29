import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'

interface RepoChipActionProps {
  deleteRepo: () => void
}

export const RepoChipActions = ({ deleteRepo }: RepoChipActionProps) => {
  return (
    <VSCodeButton appearance='icon' aria-label='Delete Repo' onClick={deleteRepo}>
      <span className='icon codicon codicon-trash'></span>
    </VSCodeButton>
  )
}
