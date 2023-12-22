import {Button, Card, CardActions, CardContent, CardHeader, Drawer, IconButton, Stack, Typography} from '@mui/material'
import {createContext, useContext} from 'react'
import {BuildContext, BuildEditContext} from './building'
import {TermDisplay} from './term'
import {Close} from '@mui/icons-material'
import type {Synset} from './resources'
import {SynsetDisplay} from './synset'

export type InfoDrawerState = {type: 'term'; value: string} | {type: 'synset'; value: string; info: Synset}
export type InfoDrawerActions = {type: 'add'; state: InfoDrawerState} | {type: 'back' | 'reset'}
export const InfoDrawerContext = createContext((action: InfoDrawerActions) => {})

function TermContent({term}: {term: string}) {
  const Dict = useContext(BuildContext)
  const editDictionary = useContext(BuildEditContext)
  return (
    <>
      <CardContent sx={{overflowY: 'auto', pt: 0}}>
        <TermDisplay term={term} />
      </CardContent>
      <CardActions sx={{justifyContent: 'flex-end', mt: 'auto'}}>
        <Button
          onClick={() => {
            editDictionary({type: term in Dict ? 'remove' : 'add', term: term})
          }}
        >
          {term in Dict ? 'Remove' : 'Add'}
        </Button>
      </CardActions>
    </>
  )
}

function SynsetContent({info}: {info: Synset}) {
  return (
    <CardContent sx={{overflowY: 'auto', mb: 'auto', pt: 0}}>
      <SynsetDisplay info={info} />
    </CardContent>
  )
}

export function InfoDrawer({state, edit}: {state: InfoDrawerState[]; edit: (action: InfoDrawerActions) => void}) {
  if (!state.length) return
  const close = () => edit({type: 'reset'})
  const currentState = state[0]
  return (
    <Drawer
      open={currentState.value !== ''}
      onClose={close}
      variant="permanent"
      hideBackdrop={true}
      anchor="bottom"
      sx={{
        '& .MuiPaper-root': {height: '45vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'},
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
              {state.length > 1 ? (
                <Button onClick={() => edit({type: 'back'})} sx={{opacity: 0.7}}>
                  {state[1].value}
                </Button>
              ) : (
                <></>
              )}
              <Typography variant="h4">{currentState.value}</Typography>
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
