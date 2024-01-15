import {Button, Card, CardActions, CardContent, CardHeader, Drawer, IconButton, Stack, Typography} from '@mui/material'
import {createContext, useContext} from 'react'
import {BuildContext, BuildEditContext} from './building'
import {TermDisplay} from './term'
import {Close} from '@mui/icons-material'
import type {Synset} from './resources'
import {SynsetDisplay} from './synset'
import {INFO_DRAWER_HEIGHT} from './settingsMenu'
import {EditorTermSetter} from './termEditor'

export type InfoDrawerState = {type: 'term'; value: string} | {type: 'synset'; value: string; info: Synset}
export type InfoDrawerActions = {type: 'add'; state: InfoDrawerState} | {type: 'back' | 'reset'}
export const InfoDrawerContext = createContext<InfoDrawerState[]>([])
export const InfoDrawerSetter = createContext((action: InfoDrawerActions) => {})

function TermContent({term}: {term: string}) {
  const Dict = useContext(BuildContext)
  const editDictionary = useContext(BuildEditContext)
  const isInDict = term in Dict
  return (
    <>
      <CardContent sx={{overflowY: 'auto', pb: 0, pt: 0}}>
        <TermDisplay term={term} />
      </CardContent>
      <CardActions sx={{justifyContent: 'flex-end', mt: 'auto'}}>
        <Button
          onClick={() => {
            editDictionary(isInDict ? {type: 'remove', term: term} : {type: 'add', term: term, term_type: 'fixed'})
          }}
        >
          {isInDict ? 'Remove' : 'Add'}
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

export function InfoDrawer() {
  const dict = useContext(BuildContext)
  const edit = useContext(InfoDrawerSetter)
  const setEditorTerm = useContext(EditorTermSetter)
  const state = useContext(InfoDrawerContext)
  if (!state.length) return
  const close = () => {
    edit({type: 'reset'})
  }
  const currentState = state[0]
  return (
    <Drawer
      open={currentState.value !== ''}
      onClose={close}
      variant="permanent"
      hideBackdrop={true}
      anchor="bottom"
      sx={{
        '& .MuiPaper-root': {
          height: INFO_DRAWER_HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        },
      }}
    >
      <Card>
        <CardHeader
          action={
            <IconButton aria-label="Close info drawer" onClick={close} className="close-button">
              <Close />
            </IconButton>
          }
          title={
            <Stack direction="row">
              {state.length > 1 ? (
                <Button onClick={() => edit({type: 'back'})} sx={{opacity: 0.8}}>
                  {state[1].value}
                </Button>
              ) : (
                <></>
              )}
              {currentState.value in dict ? (
                <Button sx={{textTransform: 'none', p: 0}} onClick={() => setEditorTerm(currentState.value)}>
                  <Typography variant="h3">{currentState.value}</Typography>
                </Button>
              ) : (
                <Typography variant="h3">{currentState.value}</Typography>
              )}
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
