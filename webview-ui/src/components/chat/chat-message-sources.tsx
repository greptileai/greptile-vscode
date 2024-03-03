import * as React from 'react'

import { ChatLoadingSkeleton } from './chat-loading-skeleton'
import { getRepoUrlForAction } from '../../lib/greptile-utils'
import { Source, RepositoryInfo } from '../../types/chat'

interface IChatMessageSources {
  sources: Source[] | undefined
  repoStates: { [repoKey: string]: RepositoryInfo }
  isLoading: boolean
}

export const ChatMessageSources = ({ sources, repoStates, isLoading }: IChatMessageSources) => {
  const [expandedSources, setExpandedSources] = React.useState<boolean>(false)
  const numberOfSourcesToDisplayWhenCollapsed = 3
  const skeletonArray = Array.from(Array(numberOfSourcesToDisplayWhenCollapsed + 1).keys())

  const getURL = (repoKey: string, repoState: RepositoryInfo, source: Source) => {
    if (repoState?.external) return `https://${repoKey}${source?.filepath}`

    return getRepoUrlForAction(
      {
        repository: repoState?.repository,
        branch: repoState?.branch,
        remote: repoState?.remote,
      },
      'source',
      {
        filepath: source?.filepath,
        lines:
          source?.linestart && source?.lineend ? [source?.linestart, source?.lineend] : undefined,
      }
    )
  }
  const sourcesCount = sources?.length || 0
  if (!sources || sourcesCount === 0) return <div></div>

  return (
    <div>
      <p>{sourcesCount} result(s)</p>
      {(expandedSources ? sources : sources.slice(0, numberOfSourcesToDisplayWhenCollapsed)).map(
        (source: Source, index: number) => {
          const remote = source?.remote || 'github'
          const branch = source?.branch || 'main'
          const repo = source?.repository

          const urlRepoKey = `${remote}:${branch}:${repo}`
          const repoKey = `${remote}:${repo}:${branch}`

          return (
            <div className='source'>
              <div className='icon codicon codicon-github'></div>
              <span>&nbsp;</span>
              <a key={index} href={getURL(urlRepoKey, repoStates[repoKey], source)} target='_blank'>
                <div className='source'>
                  {repo}:{branch}
                  <span>{source?.filepath}</span>{' '}
                  {source?.linestart && source?.lineend
                    ? `[${source?.linestart}:${source.lineend}]`
                    : ''}
                  <span>&nbsp;</span>
                  <div className='icon codicon codicon-link-external'></div>
                </div>
              </a>
            </div>
          )
        }
      )}

      {(expandedSources ||
        (!expandedSources && sources.length > numberOfSourcesToDisplayWhenCollapsed)) && (
        <div onClick={() => setExpandedSources(!expandedSources)}>
          <div>
            {expandedSources ? (
              <div className='icon codicon codicon-chevron-up'></div>
            ) : (
              <div className='icon codicon codicon-chevron-down'></div>
            )}
            {expandedSources
              ? `Collapse`
              : `View ${sources.length - numberOfSourcesToDisplayWhenCollapsed} More...`}
          </div>
        </div>
      )}

      {/* {skeletonArray.map((i) => {
        if (isLoading && sources.length < i + 1) {
          return <ChatLoadingSkeleton /> // <Skeleton key={i} className="w-full h-8" />;
        }
      })} */}
    </div>
  )
}
