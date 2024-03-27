// import { useState, useEffect, useContext } from 'react'
// import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'

// import { SessionContext } from '../../providers/session-provider'
// import { useChatLoadingState } from '../../providers/chat-state-loading-provider'
// import { useChatState } from '../../providers/chat-state-provider'
// import { API_BASE } from '../../data/constants'
// import { vscode } from '../../lib/vscode-utils'

// interface ChatStatusProps {
//   repoKey: string
// }

// export const ChatStatus = ({ repoKey }: ChatStatusProps) => {
//   const { session, setSession } = useContext(SessionContext)

//   const [progress, setProgress] = useState(0)
//   const [isRetrying, setIsRetrying] = useState(false)
//   const { chatLoadingState, chatLoadingStateDispatch } = useChatLoadingState()
//   const { chatState, chatStateDispatch } = useChatState()

//   // const repoInfo = session?.state?.repoStates[repoKey] || {
//   //   status: 'submitted',
//   //   repository: repoKey,
//   //   branch: '',
//   //   remote: '',
//   //   numFiles: 1,
//   //   filesProcessed: 0,
//   // }
//   const repoInfo = {
//     status: "processing", 
//     repository: "test-repo",
//     branch: "main",
//     remote: "github",
//     numFiles: 10,
//     filesProcessed: 5
//   }

//   useEffect(() => {
//     setProgress((100 * (repoInfo?.filesProcessed || 1)) / (repoInfo?.numFiles || 1))
//   }, [repoInfo?.filesProcessed, repoInfo?.numFiles])

//   const steps = ['submitted', 'cloning', 'processing', 'completed', 'failed', undefined]

//   useEffect(() => {
//     // increment by 1 every second
//     const interval = setInterval(() => {
//       setProgress((progress) => (progress >= 100 ? 100 : progress + 2 / (repoInfo?.numFiles || 1)))
//     }, 100)
//     return () => clearInterval(interval)
//   }, [repoInfo?.numFiles])

//   const currentStep = repoInfo?.status ? steps.indexOf(repoInfo.status) : 0
//   return repoInfo?.status === 'completed' ||
//     (repoInfo?.status === 'processing' && repoInfo?.numFiles === repoInfo?.filesProcessed) ? (
//     <div></div>
//   ) : (
//     <div>
//       {/* <span className='processing-title'>
//       Processing{' '}
//       <code>
//         {repoInfo.repository} ({repoInfo.branch})
//       </code>
//     </span> */}
//       <div className='processing-body'>
//         <div id='submitted' className='processing-grid'>
//           <CircularProgressBar
//             progress={repoInfo.status === 'submitted' ? 50 : 0}
//             size={16}
//             completed={repoInfo.status === 'cloning' || repoInfo.status === 'processing'}
//           />
//           <div className='processing-status'>
//             {currentStep <= 0 ? 'Submitting repository...' : 'Repository submitted'}
//           </div>
//         </div>
//         <div id='cloning' className='processing-grid'>
//           <CircularProgressBar
//             progress={repoInfo.status === 'cloning' ? 50 : 0}
//             size={16}
//             completed={repoInfo.status === 'processing'}
//           />
//           <div className='processing-status'>
//             {currentStep <= 1
//               ? currentStep < 1
//                 ? 'Clone repository for processing'
//                 : 'Cloning repository...'
//               : 'Repository cloned'}
//           </div>
//         </div>
//         <div id='processing' className='processing-grid'>
//           <CircularProgressBar
//             progress={
//               repoInfo.status === 'processing'
//                 ? ((repoInfo?.filesProcessed || 0) / (repoInfo?.numFiles || 1)) * 100
//                 : 0
//             }
//             size={16}
//           />
//           <div className='processing-status'>
//             {currentStep <= 2
//               ? currentStep < 2
//                 ? 'Process repository'
//                 : 'Processing repository...'
//               : 'Repository processed'}
//           </div>
//           <div>
//             {(
//               Math.min((repoInfo?.filesProcessed || 0) / (repoInfo?.numFiles || 1), 0.99) * 100
//             ).toFixed(0)}
//             %
//           </div>
//         </div>
//         {repoInfo.status !== 'failed' ? (
//           <div id='completed' className='processing-grid'>
//             <CircularProgressBar progress={0} size={16} />
//             <div className='processing-status'>Complete</div>
//           </div>
//         ) : (
//           <>
//             <div id='failed' className='processing-grid'>
//               <CircularProgressBar progress={100} size={16} />
//               <div className='processing-status'>Failed to process</div>
//             </div>
//             <div>
//               <VSCodeButton
//                 className='retry-button'
//                 onClick={() => {
//                   console.log('Retrying repository submission')
//                   setIsRetrying(true)
//                   chatLoadingStateDispatch({
//                     action: 'set_loading_repo_states',
//                     payload: {
//                       ...chatState.repoStates,
//                       [repoKey]: {
//                         ...chatState.repoStates[repoKey],
//                         status: 'submitted',
//                       },
//                     },
//                   })
//                   chatStateDispatch({
//                     action: 'set_repo_states',
//                     payload: {
//                       ...chatState.repoStates,
//                       [repoKey]: {
//                         ...chatState.repoStates[repoKey],
//                         status: 'submitted',
//                       },
//                     },
//                   })
//                   fetch(`${API_BASE}/prod/v1/repositories`, {
//                     method: 'POST',
//                     body: JSON.stringify({
//                       remote: repoInfo?.remote,
//                       repository: repoInfo?.repository,
//                       branch: repoInfo?.branch,
//                     }),
//                     headers: {
//                       'Content-Type': 'application/json',
//                       'Authorization': 'Bearer ' + session?.user?.tokens?.github.accessToken,
//                     },
//                   }).then(async (res) => {
//                     setIsRetrying(false)
//                     if (res.ok) {
//                       return res
//                     } else if (res.status === 404) {
//                       console.log('Error: Needs refresh or unauthorized')
//                       vscode.postMessage({
//                         command: 'error',
//                         text: 'This repository/branch was not found, or you do not have access to it. If this is your repo, please try signing in again. Reach out to us on [Discord](https://discord.com/invite/xZhUcFKzu7) for support.',
//                       })
//                     } else {
//                       vscode.postMessage({
//                         command: 'error',
//                         text: 'Please reach out to us on [Discord](https://discord.com/invite/xZhUcFKzu7) for support.',
//                       })
//                     }
//                     return res
//                   })
//                 }}
//               >
//                 {isRetrying ? 'Loading...' : 'Retry'}
//               </VSCodeButton>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   )
// }

// interface CircularProgressBarProps {
//   progress: number
//   size: number
//   completed?: boolean
// }

// const CircularProgressBar = ({ progress, size, completed }: CircularProgressBarProps) => {
//   const strokeWidth = 2
//   const radius = size / 2 - strokeWidth
//   const circumference = radius * 2 * Math.PI
//   const strokeDasharray = `${Math.round((progress / 100) * circumference)} ${Math.round(
//     circumference
//   )}`
//   // console.log(
//   //   "progress",
//   //   progress,
//   //   "size",
//   //   size,
//   //   "strokeWidth",
//   //   strokeWidth,
//   //   "radius",
//   //   radius,
//   //   "circumference",
//   //   circumference,
//   //   "strokeDasharray",
//   //   strokeDasharray,
//   // );

//   if (completed) {
//     return (
//       <div>
//         <div className='text-green icon codicon codicon-pass'></div>
//       </div>
//     )
//   }

//   return (
//     <svg width={size} height={size} className='circular-progress-bar'>
//       <circle
//         className='outline'
//         strokeWidth={strokeWidth}
//         r={radius}
//         cx={size / 2}
//         cy={size / 2}
//       />
//       <circle
//         className='fill'
//         strokeWidth={strokeWidth}
//         r={radius}
//         cx={size / 2}
//         cy={size / 2}
//         strokeDasharray={strokeDasharray}
//         transform={`rotate(-90 ${size / 2} ${size / 2})`}
//       />
//     </svg>
//   )
// }
import { useState, useEffect, useContext } from 'react';
import { VSCodeButton } from '@vscode/webview-ui-toolkit/react';

import { SessionContext } from '../../providers/session-provider';
import { useChatLoadingState } from '../../providers/chat-state-loading-provider';
import { useChatState } from '../../providers/chat-state-provider';
import { API_BASE } from '../../data/constants';
import { vscode } from '../../lib/vscode-utils';

interface ChatStatusProps {
  repoKey: string;
}

export const ChatStatus = ({ repoKey }: ChatStatusProps) => {
  const { session, setSession } = useContext(SessionContext);
  const [progress, setProgress] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const { chatLoadingState, chatLoadingStateDispatch } = useChatLoadingState();
  const { chatState, chatStateDispatch } = useChatState();

  const repoInfo = {
    status: 'processing',
    repository: 'test-repo',
    branch: 'main',
    remote: 'github',
    numFiles: 10,
    filesProcessed: 5,
  };

  useEffect(() => {
    setProgress((100 * (repoInfo?.filesProcessed || 1)) / (repoInfo?.numFiles || 1));
  }, [repoInfo?.filesProcessed, repoInfo?.numFiles]);

  const steps = ['submitted', 'cloning', 'processing', 'completed', 'failed', undefined];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((progress) => (progress >= 100 ? 100 : progress + 2 / (repoInfo?.numFiles || 1)));
    }, 100);
    return () => clearInterval(interval);
  }, [repoInfo?.numFiles]);

  const currentStep = repoInfo?.status ? steps.indexOf(repoInfo.status) : 0;

  return repoInfo?.status === 'completed' ||
    (repoInfo?.status === 'processing' && repoInfo?.numFiles === repoInfo?.filesProcessed) ? (
    null
  ) : (
    <div style={{ display: 'table', width: '100%', rowGap: '2px' }}>
      <div style={{ display: 'table-row' }}>
        <div style={{ display: 'table-cell', verticalAlign: 'middle', padding: '4px' }}>
          <CircularProgressBar
            progress={repoInfo.status === 'submitted' ? 50 : 0}
            size={16}
            completed={repoInfo.status === 'cloning' || repoInfo.status === 'processing'}
          />
        </div>
        <div style={{ display: 'table-cell', verticalAlign: 'middle', padding: '4px' }}>
          {currentStep <= 0 ? 'Submitting repository...' : 'Repository submitted'}
        </div>
      </div>
      <div style={{ display: 'table-row' }}>
        <div style={{ display: 'table-cell', verticalAlign: 'middle', padding: '4px' }}>
          <CircularProgressBar
            progress={repoInfo.status === 'cloning' ? 50 : 0}
            size={16}
            completed={repoInfo.status === 'processing'}
          />
        </div>
        <div style={{ display: 'table-cell', verticalAlign: 'middle', padding: '4px' }}>
          {currentStep <= 1
            ? currentStep < 1
              ? 'Clone repository for processing'
              : 'Cloning repository...'
            : 'Repository cloned'}
        </div>
      </div>
      <div style={{ display: 'table-row' }}>
        <div style={{ display: 'table-cell', verticalAlign: 'middle', padding: '4px' }}>
          <CircularProgressBar
            progress={
              repoInfo.status === 'processing'
                ? ((repoInfo?.filesProcessed || 0) / (repoInfo?.numFiles || 1)) * 100
                : 0
            }
            size={16}
          />
        </div>
        <div style={{ display: 'table-cell', verticalAlign: 'middle', padding: '4px' }}>
          {currentStep <= 2
            ? currentStep < 2
              ? 'Process repository'
              : 'Processing repository...'
            : 'Repository processed'}
        </div>
        <div style={{ display: 'table-cell', verticalAlign: 'middle', padding: '4px' }}>
          {(Math.min((repoInfo?.filesProcessed || 0) / (repoInfo?.numFiles || 1), 0.99) * 100).toFixed(0)}%
        </div>
      </div>
      {repoInfo.status !== 'failed' ? (
        <div style={{ display: 'table-row' }}>
          <div style={{ display: 'table-cell', verticalAlign: 'middle', padding: '4px' }}>
            <CircularProgressBar progress={0} size={16} />
          </div>
          <div style={{ display: 'table-cell', verticalAlign: 'middle', padding: '4px' }}>
            Complete
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'table-row' }}>
            <div style={{ display: 'table-cell', verticalAlign: 'middle', padding: '4px' }}>
              <CircularProgressBar progress={100} size={16} />
            </div>
            <div style={{ display: 'table-cell', verticalAlign: 'middle', padding: '4px' }}>
              Failed to process
            </div>
          </div>
          <div style={{ display: 'table-row' }}>
            <div style={{ display: 'table-cell', verticalAlign: 'middle', padding: '4px' }}>
              <VSCodeButton
                style={{ marginTop: '4px' }}
                onClick={() => {
                  console.log('Retrying repository submission');
                  setIsRetrying(true);
                  chatLoadingStateDispatch({
                    action: 'set_loading_repo_states',
                    payload: {
                      ...chatState.repoStates,
                      [repoKey]: {
                        ...chatState.repoStates[repoKey],
                        status: 'submitted',
                      },
                    },
                  });
                  chatStateDispatch({
                    action: 'set_repo_states',
                    payload: {
                      ...chatState.repoStates,
                      [repoKey]: {
                        ...chatState.repoStates[repoKey],
                        status: 'submitted',
                      },
                    },
                  });
                  fetch(`${API_BASE}/prod/v1/repositories`, {
                    method: 'POST',
                    body: JSON.stringify({
                      remote: repoInfo?.remote,
                      repository: repoInfo?.repository,
                      branch: repoInfo?.branch,
                    }),
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: 'Bearer ' + session?.user?.tokens?.github.accessToken,
                    },
                  }).then(async (res) => {
                    setIsRetrying(false);
                    if (res.ok) {
                      return res;
                    } else if (res.status === 404) {
                      console.log('Error: Needs refresh or unauthorized');
                      vscode.postMessage({
                        command: 'error',
                        text: 'This repository/branch was not found, or you do not have access to it. If this is your repo, please try signing in again. Reach out to us on [Discord](https://discord.com/invite/xZhUcFKzu7) for support.',
                      });
                    } else {
                      vscode.postMessage({
                        command: 'error',
                        text: 'Please reach out to us on [Discord](https://discord.com/invite/xZhUcFKzu7) for support.',
                      });
                    }
                    return res;
                  });
                }}
              >
                {isRetrying ? 'Loading...' : 'Retry'}
              </VSCodeButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface CircularProgressBarProps {
  progress: number;
  size: number;
  completed?: boolean;
}

const CircularProgressBar = ({ progress, size, completed }: CircularProgressBarProps) => {
  const strokeWidth = 2;
  const radius = size / 2 - strokeWidth;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = completed ? `${Math.round(circumference)} ${Math.round(circumference)}`: `${Math.round((progress / 100) * circumference)} ${Math.round(circumference)}`;

  if (completed) {
    return (
      <svg width={size} height={size} style={{ verticalAlign: 'middle' }}>
        <circle
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ stroke: '#e0e0e0', fill: 'none' }}
        />
        <circle
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={strokeDasharray}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ stroke: '#007acc', fill: 'none' }}
        />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} style={{ verticalAlign: 'middle' }}>
      <circle
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
        style={{ stroke: '#e0e0e0', fill: 'none' }}
      />
      <circle
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
        strokeDasharray={strokeDasharray}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ stroke: '#007acc', fill: 'none' }}
      />
    </svg>
  );
};