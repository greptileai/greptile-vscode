import { useContext } from 'react'

import { SessionContext } from '../../providers/session-provider'
import { deserializeRepoKey } from '../../lib/onboard-utils'
import { RepositoryInfo } from '../../types/chat'

interface RepoChipProps {
  repoKey: string
  children?: React.ReactNode
}

export const RepoChip = ({ repoKey: sRepoKey, children }: RepoChipProps) => {
  const { session, setSession } = useContext(SessionContext)
  const repoStates = session?.state?.repoStates

  if (!repoStates || !repoStates[sRepoKey]) return
  const repoKey = deserializeRepoKey(sRepoKey)

  const getStatusColor = (status: RepositoryInfo['status'] | 'readonly') => {
    switch (status) {
      case 'completed':
        return 'text-green'
      case 'submitted':
      case 'cloning':
      case 'processing':
        return 'text-yellow'
      case 'failed':
        return 'text-red'
      case 'queued':
      default:
        return 'text-gray'
    }
  }

  const chipState = repoStates[sRepoKey].status || 'readonly'

  return (
    <div className='repo-chip'>
      <span className={`${getStatusColor(chipState)}`}>●</span> <p>{repoKey.repository}</p>
      {children}
    </div>
  )
}
