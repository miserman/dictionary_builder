import {Box, Link, List, Stack, Tooltip, Typography} from '@mui/material'
import {useContext} from 'react'
import {ResourceContext, type Synset} from './resources'
import {InfoDrawerSetter} from './infoDrawer'
import {termListItem} from './term'
import {BuildContext, BuildEditContext} from './building'

export function SynsetLink({senseKey, info}: {senseKey: string; info: Synset}) {
  const updateInfoDrawerState = useContext(InfoDrawerSetter)
  return (
    <Tooltip title={info.definition} placement="right">
      <Typography sx={{display: 'flex', '& span': {pl: 0.5}}}>
        <Link
          underline="none"
          sx={{p: 0, justifyContent: 'flex-start', cursor: 'pointer'}}
          onClick={() => updateInfoDrawerState({type: 'add', state: {type: 'synset', value: senseKey, info: info}})}
        >
          {senseKey}
        </Link>
        {info.count && <span className="number-annotation">{' ' + info.count}</span>}
      </Typography>
    </Tooltip>
  )
}

function retrieveTerms(indices: number | number[], terms: readonly string[]) {
  return Array.isArray(indices) ? indices.map(i => terms[i - 1]) : [terms[indices - 1]]
}
function retrieveSynsets(indices: number | string | (number | string)[], synsetInfo: readonly Synset[]) {
  return Array.isArray(indices)
    ? 'number' === typeof indices[0]
      ? (indices as number[]).map(i => synsetInfo[i - 1])
      : []
    : 'number' === typeof indices
    ? [synsetInfo[indices - 1]]
    : []
}
const synsetRelationships = {
  attribute: true,
  domain_topic: true,
  similar: true,
  also: true,
  domain_region: true,
  exemplifies: true,
  mero_part: true,
  hypernym: true,
  instance_hypernym: true,
  mero_member: true,
  mero_substance: true,
  entails: true,
  causes: true,
  derivation: true,
  pertainym: true,
  adjposition: true,
  agent: true,
  antonym: true,
  body_part: true,
  by_means_of: true,
  destination: true,
  event: true,
  instrument: true,
  location: true,
  material: true,
  participle: true,
  property: true,
  result: true,
  state: true,
  undergoer: true,
  uses: true,
  vehicle: true,
  hyponym: true,
  instance_hyponym: true,
  domain_topic_members: true,
}
export function unpackSynsetMembers(synset: Synset, terms: readonly string[], synsetInfo: readonly Synset[]) {
  const members: Set<string> = new Set(retrieveTerms(synset.members, terms))
  Object.keys(synset).forEach(k => {
    if (k in synsetRelationships) {
      const related = retrieveSynsets(synset[k as keyof Synset], synsetInfo)
      related.forEach(s => retrieveTerms(s.members, terms).forEach(sm => members.add(sm)))
    }
  })
  return Array.from(members)
}

function DisplayEntry({name, info}: {name: keyof Synset; info: Synset}) {
  const content = info[name] as string | number | number[]
  const dict = useContext(BuildContext)
  const editDictionary = useContext(BuildEditContext)
  const updateInfoDrawerState = useContext(InfoDrawerSetter)
  const {terms, sense_keys, synsetInfo} = useContext(ResourceContext)
  if (!terms || !sense_keys || !synsetInfo) return <></>
  const linkTerms = (index: number | number[]) => {
    return (
      terms &&
      (Array.isArray(index)
        ? index.map(i => termListItem(terms[i - 1], dict, editDictionary, updateInfoDrawerState))
        : termListItem(terms[index - 1], dict, editDictionary, updateInfoDrawerState))
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

const basicInfo = {
  id: 0,
  index: 0,
  count: 0,
  ili: 0,
  definition: 0,
  topic: 0,
  csi_labels: 0,
  wikidata: 0,
  source: 0,
  sense_index: 0,
  nltk_id: 0,
  babelnet: 0,
}
const partsOfSpeech = {a: 'adj', r: 'adv', s: 'adj', n: 'noun', v: 'verb'}
export function SynsetDisplay({info}: {info: Synset}) {
  const {sense_keys, senseMap} = useContext(ResourceContext)
  const key = sense_keys ? sense_keys[info.index] : ''
  const labels = key && key in senseMap ? senseMap[key] : info.csi_labels
  return (
    <>
      <Typography variant="h6">{info.definition}</Typography>
      <Stack direction="row" spacing={2}>
        <Box>
          <Typography component="p" variant="caption" sx={{ml: 1}}>
            Open English WordNet ID:{' '}
            <Link href={'https://en-word.net/id/oewn-' + info.id} rel="noreferrer" target="_blank">
              {info.id}
            </Link>
          </Typography>
          {info.ili && (
            <Typography component="p" variant="caption" sx={{ml: 1}}>
              Interlingual ID: <span className="number">{info.ili}</span>
            </Typography>
          )}
          {info.nltk_id && (
            <Typography component="p" variant="caption" sx={{ml: 1}}>
              Natural Language Toolkit ID: <span className="number">{info.nltk_id}</span>
            </Typography>
          )}
          {info.babelnet && (
            <Typography component="p" variant="caption" sx={{ml: 1}}>
              BabelNet ID:{' '}
              <Link href={'https://babelnet.org/synset?lang=EN&id=' + info.babelnet} rel="noreferrer" target="_blank">
                {info.babelnet}
              </Link>
            </Typography>
          )}
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
          {labels && (
            <Typography component="p" variant="caption" sx={{ml: 1}}>
              Coarse Labels: <span className="number">{'string' === typeof labels ? labels : labels.join(', ')}</span>
            </Typography>
          )}
          {info.count && (
            <Tooltip title="frequency within the combined SemCor and One Million Sense-Tagged Instances training data">
              <Typography component="p" variant="caption" sx={{ml: 1}}>
                SemCor+OMSTI Count: <span className="number">{info.count}</span>
              </Typography>
            </Tooltip>
          )}
        </Box>
        {(info.wikidata || info.source) && (
          <Box>
            {info.source && (
              <Typography component="p" variant="caption" sx={{ml: 1}}>
                Source: <span className="number">{info.source}</span>
              </Typography>
            )}
            {info.wikidata && (
              <Typography component="p" variant="caption" sx={{ml: 1}}>
                Wikidata:{' '}
                <Link href={'https://www.wikidata.org/wiki/' + info.wikidata} rel="noreferrer" target="_blank">
                  {info.wikidata}
                </Link>
              </Typography>
            )}
          </Box>
        )}
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
