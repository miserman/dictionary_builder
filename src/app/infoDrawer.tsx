import {
  Box,
  Button,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  List,
  ListItem,
  Stack,
  Typography,
} from '@mui/material'
import {createContext, useContext, useState} from 'react'
import {BuildContext, BuildEditContext, Processed, processTerm} from './building'
import type {FixedTerm} from './term'
import {Close} from '@mui/icons-material'
import {TermInfo} from './termInfo'
import {ResourceContext, Synset} from './resources'
import {SynsetInfo} from './synsetInfo'

export type InfoDrawerState = {type: 'term'; value: string} | {type: 'synset'; value: string; info: Synset}
export type InfoDrawerActions = {type: 'add'; state: InfoDrawerState} | {type: 'reset'}
export const InfoDrawerContext = createContext((action: InfoDrawerActions) => {})

function DisplayTerm({term}: {term: string}) {
  const Data = useContext(ResourceContext)
  const Dict = useContext(BuildContext)
  const editDictionary = useContext(BuildEditContext)
  const processedTerms = useContext(Processed)
  if (!(term in processedTerms)) {
    processedTerms[term] = processTerm(term, Data)
  }
  const processed = processedTerms[term] as FixedTerm
  return (
    <Box>
      <DialogContent>
        <Stack direction="row" spacing={4}>
          {processed.similar.length ? (
            <Stack>
              <Typography variant="h5">Similar Terms</Typography>
              <Box sx={{maxHeight: '20vh', overflowY: 'auto'}}>
                <List sx={{p: 0}}>
                  {processed.similar.map(term => (
                    <ListItem key={term} sx={{p: 0}}>
                      {<TermInfo term={term}></TermInfo>}
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Stack>
          ) : (
            <></>
          )}
          {processed.synsets.length ? (
            <Stack>
              <Typography variant="h5">Senses</Typography>
              <Box sx={{maxHeight: '20vh', overflowY: 'auto'}}>
                <List sx={{p: 0}}>
                  {processed.synsets.map(info => (
                    <ListItem key={info.key} sx={{p: 0}}>
                      <SynsetInfo info={info} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Stack>
          ) : (
            <></>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            editDictionary({type: processed.term in Dict ? 'remove' : 'add', term: processed.term})
          }}
        >
          {processed.term in Dict ? 'Remove' : 'Add'}
        </Button>
      </DialogActions>
    </Box>
  )
}

const id_pattern = /^\d+-\w$/
function DisplayEntry({name, info, ids, allInfo}: {name: string; info: Synset; ids: string[]; allInfo: Synset[]}) {
  const content = info[name]
  return (
    <Box key={name}>
      <Typography variant="h5">{name}</Typography>
      <Typography sx={{paddingLeft: 2}}>
        {name === 'members' ? (
          Array.isArray(content) ? (
            content.map(entry => <TermInfo key={entry} term={entry} />)
          ) : (
            <TermInfo key={content} term={content} />
          )
        ) : Array.isArray(content) ? (
          content.map(
            id_pattern.test(content[0])
              ? id => <SynsetInfo info={allInfo[ids.indexOf(id)]} />
              : entry => <Chip label={entry} />
          )
        ) : id_pattern.test(content) ? (
          <SynsetInfo info={allInfo[ids.indexOf(content)]} />
        ) : (
          content
        )}
      </Typography>
    </Box>
  )
}

function DisplaySynset({info}: {info: Synset}) {
  const {synsets, synsetInfo} = useContext(ResourceContext)
  return (
    <Box>
      <DialogContent>
        {synsets && synsetInfo ? (
          Object.keys(info).map(k => <DisplayEntry key={k} name={k} info={info} ids={synsets} allInfo={synsetInfo} />)
        ) : (
          <></>
        )}
      </DialogContent>
    </Box>
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
    <Drawer open={currentState.value !== ''} onClose={close} variant="persistent" hideBackdrop={true} anchor="bottom">
      <DialogTitle>
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
      </DialogTitle>

      <IconButton
        aria-label="Close"
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
        }}
        onClick={close}
      >
        <Close />
      </IconButton>

      {currentState.type === 'term' ? (
        <DisplayTerm term={currentState.value} />
      ) : (
        <DisplaySynset info={currentState.info} />
      )}
    </Drawer>
  )
}
