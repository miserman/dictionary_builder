import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import {createContext, useCallback, useContext, useEffect} from 'react'
import {BuildContext, BuildEditContext, SettingEditor, SettingsContext} from './building'
import {TermDisplay} from './term'
import {Close} from '@mui/icons-material'
import type {Synset} from './resources'
import {SynsetDisplay} from './synset'
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
      <CardContent sx={{overflowY: 'auto', pb: 0, pt: 0, height: '100%'}}>
        <TermDisplay term={term} />
      </CardContent>
      <CardActions sx={{justifyContent: 'flex-end', p: 0}}>
        <Button
          onClick={() => {
            editDictionary(isInDict ? {type: 'remove', term_id: term} : {type: 'add', term, term_type: 'fixed'})
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

let resizeAnimationFrame = -1
export function InfoDrawer({height, setHeight}: {height: number; setHeight: (height: number) => void}) {
  const dict = useContext(BuildContext)
  const edit = useContext(InfoDrawerSetter)
  const settings = useContext(SettingsContext)
  const updateSettings = useContext(SettingEditor)
  const setEditorTerm = useContext(EditorTermSetter)
  const state = useContext(InfoDrawerContext)
  const resize = useCallback(
    (e: MouseEvent) => {
      const value = Math.max(18, Math.min(Math.ceil((1 - e.y / window.innerHeight) * 100), 87))
      if (value !== height) {
        cancelAnimationFrame(resizeAnimationFrame)
        resizeAnimationFrame = requestAnimationFrame(() => {
          setHeight(value)
          window.dispatchEvent(new Event('resize'))
        })
      }
    },
    [setHeight]
  )
  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      document.body.style.cursor = 'ns-resize'
      window.addEventListener('mousemove', resize)
    },
    [resize]
  )
  useEffect(() => {
    const endResize = (e: MouseEvent) => {
      if (resizeAnimationFrame !== -1) {
        cancelAnimationFrame(resizeAnimationFrame)
        resizeAnimationFrame = -1
        document.body.style.cursor = 'default'
        window.removeEventListener('mousemove', resize)
        const value = Math.max(18, Math.min(Math.ceil((1 - e.y / window.innerHeight) * 100), 87))
        setHeight(value)
        settings.info_drawer_height = value
        updateSettings({...settings})
        localStorage.setItem('dictionary_builder_settings', JSON.stringify(settings))
        window.dispatchEvent(new Event('resize'))
      }
    }
    window.addEventListener('mouseup', endResize)
    return () => window.removeEventListener('mouseup', endResize)
  }, [resize, settings, updateSettings, setHeight])
  if (!state.length) return
  const close = () => {
    edit({type: 'reset'})
  }
  const currentState = state[0]
  return (
    currentState.value && (
      <Drawer
        open={true}
        onClose={close}
        variant="permanent"
        hideBackdrop={true}
        anchor="bottom"
        sx={{
          '& .MuiPaper-root': {
            height: height + 'vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          },
        }}
      >
        <Card>
          <Box
            sx={{
              width: '100%',
              backgroundColor: '#515151',
              height: '1px',
              position: 'absolute',
              cursor: 'ns-resize',
              '&:hover': {border: 'solid 2px #dab4ff'},
            }}
            onMouseDownCapture={startResize}
          ></Box>
          <CardHeader
            sx={{p: 1}}
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
  )
}
