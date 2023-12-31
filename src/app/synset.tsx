import {Box, Link, List, Stack, Tooltip, Typography} from '@mui/material'
import {useContext} from 'react'
import {ResourceContext, type Synset} from './resources'
import {InfoDrawerContext} from './infoDrawer'
import {termListItem} from './term'
import {BuildContext} from './building'

export function SynsetLink({senseKey, info}: {senseKey: string; info: Synset}) {
  const updateInfoDrawerState = useContext(InfoDrawerContext)
  return (
    <Tooltip title={info.definition} placement="right">
      <Link
        underline="none"
        sx={{p: 0, justifyContent: 'flex-start', cursor: 'pointer', display: 'block'}}
        onClick={() => updateInfoDrawerState({type: 'add', state: {type: 'synset', value: senseKey, info: info}})}
      >
        {senseKey}
      </Link>
    </Tooltip>
  )
}

function DisplayEntry({name, info}: {name: keyof Synset; info: Synset}) {
  const content = info[name] as string | number | number[]
  const dict = useContext(BuildContext)
  const {terms, sense_keys, synsetInfo} = useContext(ResourceContext)
  if (!terms || !sense_keys || !synsetInfo) return <></>
  const linkTerms = (index: number | number[]) => {
    return terms ? (
      Array.isArray(index) ? (
        index.map(i => termListItem(terms[i - 1], dict))
      ) : (
        termListItem(terms[index - 1], dict)
      )
    ) : (
      <></>
    )
  }
  return (
    <Box key={name} sx={{m: 1}}>
      <Typography variant="h5">{name}</Typography>
      <List>
        {'string' === typeof content ? (
          content
        ) : name === 'members' ? (
          linkTerms(content)
        ) : Array.isArray(content) ? (
          content.map(index => {
            const info = synsetInfo[index - 1]
            return <SynsetLink key={index} senseKey={sense_keys[index - 1]} info={info} />
          })
        ) : (
          <SynsetLink senseKey={sense_keys[content - 1]} info={synsetInfo[content - 1]} />
        )}
      </List>
    </Box>
  )
}

const basicInfo = {id: 0, index: 0, ili: 0, definition: 0, topic: 0}
const partsOfSpeech = {a: 'adj', r: 'adv', s: 'adj', n: 'noun', v: 'verb'}
export function SynsetDisplay({info}: {info: Synset}) {
  const {sense_keys} = useContext(ResourceContext)
  return (
    <>
      <Typography variant="h6">{info.definition}</Typography>
      <Stack direction="row" spacing={2}>
        <Box>
          <Typography component="p" variant="caption" sx={{ml: 1}}>
            Open English WordNet ID: <span className="number">{info.id}</span>
          </Typography>
          <Typography component="p" variant="caption" sx={{ml: 1}}>
            Sense Key: <span className="number">{sense_keys && sense_keys[info.index]}</span>
          </Typography>
          <Typography component="p" variant="caption" sx={{ml: 1}}>
            Interlingual ID: <span className="number">{info.ili}</span>
          </Typography>
        </Box>
        <Box>
          <Typography component="p" variant="caption" sx={{ml: 1}}>
            Part of Speech:{' '}
            <span className="number">
              {partsOfSpeech[info.id.substring(info.id.length - 1) as keyof typeof partsOfSpeech]}
            </span>
          </Typography>
          <Typography component="p" variant="caption" sx={{ml: 1}}>
            Topic: <span className="number">{info.topic}</span>
          </Typography>
        </Box>
      </Stack>
      <Stack direction="row" sx={{mt: 2}}>
        {Object.keys(info)
          .filter(k => !(k in basicInfo))
          .map(k => (
            <DisplayEntry key={k} name={k as keyof Synset} info={info} />
          ))}
      </Stack>
    </>
  )
}
