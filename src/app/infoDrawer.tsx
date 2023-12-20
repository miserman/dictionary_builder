import {Button, Card, CardActions, CardContent, CardHeader, Drawer, IconButton, Stack, Typography} from '@mui/material'
import {createContext, useContext, useState} from 'react'
import {BuildContext, BuildEditContext, Processed, processTerm} from './building'
import {type FixedTerm, TermDisplay} from './term'
import {Close} from '@mui/icons-material'
import {ResourceContext, Synset} from './resources'
import {SynsetDisplay} from './synset'

export type InfoDrawerState = {type: 'term'; value: string} | {type: 'synset'; value: string; info: Synset}
export type InfoDrawerActions = {type: 'add'; state: InfoDrawerState} | {type: 'reset'}
export const InfoDrawerContext = createContext((action: InfoDrawerActions) => {})

function TermContent({term}: {term: string}) {
  const Data = useContext(ResourceContext)
  const Dict = useContext(BuildContext)
  const editDictionary = useContext(BuildEditContext)
  const processedTerms = useContext(Processed)
  if (!(term in processedTerms)) {
    processedTerms[term] = processTerm(term, Data)
  }
  const processed = processedTerms[term] as FixedTerm
  return (
    <>
      <CardContent sx={{overflowY: 'auto'}}>
        <TermDisplay term={term} maxHeight="31vh" />
      </CardContent>
      <CardActions sx={{justifyContent: 'flex-end', mt: 'auto'}}>
        <Button
          onClick={() => {
            editDictionary({type: processed.term in Dict ? 'remove' : 'add', term: processed.term})
          }}
        >
          {processed.term in Dict ? 'Remove' : 'Add'}
        </Button>
      </CardActions>
    </>
  )
}

function SynsetContent({info}: {info: Synset}) {
  return (
    <CardContent sx={{overflowY: 'auto', mb: 'auto'}}>
      <SynsetDisplay info={info} />
    </CardContent>
  )
}

export function InfoDrawer({state, update}: {state: InfoDrawerState[]; update: (action: InfoDrawerActions) => void}) {
  const [historyPosition, setHistoryIndex] = useState([0, state.length])
  if (!state.length) return
  const historyIndex = historyPosition[0]
  if (state.length != historyPosition[1]) setHistoryIndex([0, state.length])
  const currentState = state[historyIndex]
  const close = () => {
    setHistoryIndex([0, 0])
    update({type: 'reset'})
  }
  return (
    <Drawer
      open={currentState.value !== ''}
      onClose={close}
      variant="permanent"
      hideBackdrop={true}
      anchor="bottom"
      sx={{
        '& .MuiPaper-root': {height: '51vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'},
      }}
    >
      <Card>
        <CardHeader
          action={
            <IconButton aria-label="Close" onClick={close}>
              <Close />
            </IconButton>
          }
          title={
            <Stack direction="row">
              <Button
                onClick={() =>
                  setHistoryIndex([historyIndex < state.length ? historyIndex + 1 : state.length - 1, state.length])
                }
                disabled={historyIndex >= state.length - 1}
                sx={{opacity: 0.7}}
              >
                {state.length > historyIndex + 1 ? state[historyIndex + 1].value : ''}
              </Button>
              <Typography variant="h4">{currentState.value}</Typography>
              <Button
                onClick={() => setHistoryIndex([historyIndex > 0 ? historyIndex - 1 : 0, state.length])}
                disabled={historyIndex < 1}
                sx={{opacity: 0.7}}
              >
                {historyIndex > 0 ? state[historyIndex - 1].value : ''}
              </Button>
            </Stack>
          }
        />

        {currentState.type === 'term' ? (
          <TermContent term={currentState.value} />
        ) : (
          <SynsetContent info={currentState.info} />
        )}
      </Card>
    </Drawer>
  )
}
