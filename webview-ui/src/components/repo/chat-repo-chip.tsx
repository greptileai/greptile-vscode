// import { useContext } from 'react'

// import { SessionContext } from '../../providers/session-provider'
// import { deserializeRepoKey } from '../../lib/greptile-utils'
// import { RepositoryInfo } from '../../types/chat'

// interface RepoChipProps {
//   repoKey: string
//   children?: React.ReactNode
// }

// export const RepoChip = ({ repoKey: sRepoKey, children }: RepoChipProps) => {
//   const { session, setSession } = useContext(SessionContext)
//   const repoStates = session?.state?.repoStates

//   if (!repoStates || !repoStates[sRepoKey]) return
//   const repoKey = deserializeRepoKey(sRepoKey)

//   const getStatusColor = (status: RepositoryInfo['status'] | 'readonly') => {
//     switch (status) {
//       case 'completed':
//         return 'text-green'
//       case 'submitted':
//       case 'cloning':
//       case 'processing':
//         return 'text-yellow'
//       case 'failed':
//         return 'text-red'
//       case 'queued':
//       default:
//         return 'text-gray'
//     }
//   }

//   const chipState = repoStates[sRepoKey].status || 'readonly'

//   return (
//     <div className='repo-chip'>
//       <span className={`${getStatusColor(chipState)}`}>●</span>{' '}
//       <p>
//         {repoKey.repository} ({repoKey.branch})
//       </p>
//       {children}
//     </div>
//   )
// }

import { useContext } from 'react';
import { SessionContext } from '../../providers/session-provider';
import { deserializeRepoKey } from '../../lib/greptile-utils';
import { RepositoryInfo } from '../../types/chat';

interface RepoChipProps {
  repoKey: string;
  children?: React.ReactNode;
}

export const RepoChip = ({ repoKey: sRepoKey, children }: RepoChipProps) => {
  const { session, setSession } = useContext(SessionContext);
  const repoStates = session?.state?.repoStates;

  if (!repoStates || !repoStates[sRepoKey]) return null;

  const repoKey = deserializeRepoKey(sRepoKey);

  const getStatusColor = (status: RepositoryInfo['status'] | 'readonly') => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'submitted':
      case 'cloning':
      case 'processing':
        return 'orange';
      case 'failed':
        return 'red';
      case 'queued':
      default:
        return 'gray';
    }
  };

  const chipState = repoStates[sRepoKey].status || 'readonly';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        border: '1px solid',
        borderColor: 'grey',
        width: 'fit-content',
        padding: '2px 8px',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '2px',
        gap: '6px',
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: getStatusColor(chipState),
        }}
      ></span>
      <span>
        {repoKey.repository} ({repoKey.branch})
      </span>
      {children}
    </div>
  );
};
