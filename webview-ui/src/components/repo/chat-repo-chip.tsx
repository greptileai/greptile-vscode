import { useContext } from 'react'

import { SessionContext } from '../../providers/session-provider'
import { deserializeRepoKey } from '../../lib/onboard-utils'
import { RepositoryInfo } from '../../types/chat'

interface RepoChipProps {
  repoKey: string
}

export const RepoChip = ({ repoKey: sRepoKey }: RepoChipProps) => {
  const { session, setSession } = useContext(SessionContext)
  const repoStates = session?.state?.repoStates

  if (!repoStates || !repoStates[sRepoKey]) return
  const repoKey = deserializeRepoKey(sRepoKey)

  const getStatusColor = (status: RepositoryInfo['status'] | 'readonly') => {
    switch (status) {
      case 'completed':
        return 'text-green'
      case 'submitted':
      case 'processing':
      case 'cloning':
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
    </div>
  )
}
