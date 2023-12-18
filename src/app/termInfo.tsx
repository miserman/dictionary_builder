import {Button} from '@mui/material'
import {useContext} from 'react'
import {FixedTerm} from './term'
import {Processed, processTerm} from './building'
import {ResourceContext} from './resources'
import {InfoDrawerContext} from './infoDrawer'

export function TermInfo({term}: {term: string}) {
  const processedTerms = useContext(Processed)
  const updateInfoDrawerState = useContext(InfoDrawerContext)
  const data = useContext(ResourceContext)
  if (!(term in processedTerms)) processedTerms[term] = processTerm(term, data)
  const processed = processedTerms[term] as FixedTerm
  if (!processed.recognized)
    return (
      <Button variant="text" disabled>
        {processed.term}
      </Button>
    )
  return (
    <Button
      variant="text"
      fullWidth
      sx={{p: 0, justifyContent: 'flex-start'}}
      onClick={() => updateInfoDrawerState({type: 'add', state: {type: 'term', value: term}})}
    >
      {processed.term}
    </Button>
  )
}
