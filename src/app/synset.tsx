import {Box, Chip, Link, Stack, Typography} from '@mui/material'
import {useContext} from 'react'
import {ResourceContext, type Synset} from './resources'
import {InfoDrawerContext} from './infoDrawer'
import {TermLink} from './term'

export function SynsetLink({info}: {info: Synset}) {
  const updateInfoDrawerState = useContext(InfoDrawerContext)
  return (
    <Link
      underline="none"
      sx={{p: 0, justifyContent: 'flex-start', cursor: 'pointer', display: 'block'}}
      onClick={() => updateInfoDrawerState({type: 'add', state: {type: 'synset', value: info.key, info: info}})}
    >
      {info.key}
    </Link>
  )
}

const id_pattern = /^\d+-\w$/
const hyphen = /-/g
function conformTerm(term: string, lookup?: {[index: string]: number}) {
  term = term.toLowerCase()
  if (lookup && !(term in lookup)) {
    term = term.replace("'", '')
    if (!(term in lookup)) {
      term = term.replace(hyphen, ' ')
    }
  }
  return term
}
function DisplayEntry({
  name,
  info,
  ids,
  allInfo,
}: {
  name: keyof Synset
  info: Synset
  ids: readonly string[]
  allInfo: readonly Synset[]
}) {
  const content = info[name] as string | string[]
  const {termLookup} = useContext(ResourceContext)
  const linkTerms = (content: string | string[], termLookup?: {[index: string]: number}) => {
    return Array.isArray(content) ? (
      content.map(entry => <TermLink key={entry} term={conformTerm(entry, termLookup)} />)
    ) : (
      <TermLink key={content} term={conformTerm(content, termLookup)} />
    )
  }
  return (
    <Box key={name} sx={{m: 1}}>
      <Typography variant="h5">{name}</Typography>
      <Typography>
        {name === 'members' ? (
          linkTerms(content, termLookup)
        ) : Array.isArray(content) ? (
          content.map(
            id_pattern.test(content[0])
              ? id => <SynsetLink key={id} info={allInfo[ids.indexOf(id)]} />
              : entry => <Chip label={entry} />
          )
        ) : id_pattern.test(content) ? (
          <SynsetLink info={allInfo[ids.indexOf(content)]} />
        ) : (
          content
        )}
      </Typography>
    </Box>
  )
}

const basicInfo = {key: 0, index: 0, ili: 0, definition: 0}
export function SynsetDisplay({info}: {info: Synset}) {
  const {synsets, synsetInfo} = useContext(ResourceContext)
  return (
    <>
      <Typography variant="h6">{info.definition}</Typography>
      <Typography component="p" variant="caption" sx={{ml: 1}}>
        Sense Key: <span className="number">{info.key}</span>
      </Typography>
      <Typography component="p" variant="caption" sx={{ml: 1}}>
        Open English WordNet ID: <span className="number">{synsets && synsets[info.index - 1]}</span>
      </Typography>
      <Typography component="p" variant="caption" sx={{ml: 1}}>
        Interlingual ID: <span className="number">{info.ili}</span>
      </Typography>
      <Stack direction="row" sx={{mt: 2}}>
        {synsets && synsetInfo ? (
          Object.keys(info)
            .filter(k => !(k in basicInfo))
            .map(k => <DisplayEntry key={k} name={k as keyof Synset} info={info} ids={synsets} allInfo={synsetInfo} />)
        ) : (
          <></>
        )}
      </Stack>
    </>
  )
}
