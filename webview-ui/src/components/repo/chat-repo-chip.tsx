import { useContext } from 'react'

import { SessionContext } from '../../providers/session-provider'
import { deserializeRepoKey } from '../../lib/onboard-utils'

interface RepoChipProps {
  repoKey: string
}

export const RepoChip = ({ repoKey: sRepoKey }: RepoChipProps) => {
  const { session, setSession } = useContext(SessionContext)
  const repoInfo = session?.state?.repoInfo

  if (!repoInfo) return
  const repoKey = deserializeRepoKey(sRepoKey)

  const getStatusColor = (status: typeof repoInfo.status | 'readonly') => {
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

  const chipState = repoInfo?.status || 'readonly'
  return (
    <div className='repo-chip'>
      <span className={`${getStatusColor(chipState)}`}>●</span> <p>{repoKey.repository}</p>
    </div>
  )
}
