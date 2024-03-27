import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'

interface RepoChipActionProps {
  deleteRepo: () => void
}

export const RepoChipActions = ({ deleteRepo }: RepoChipActionProps) => {
  return (
    <VSCodeButton
      appearance="icon"
      aria-label="Delete Repo"
      onClick={deleteRepo}
      style={{ backgroundColor: 'transparent', border: 'none', padding: '2px' }}
    >
      <span className="icon codicon codicon-trash"></span>
    </VSCodeButton>
  );
};