import {Done, Error} from '@mui/icons-material'
import {CircularProgress, List, ListItem, ListItemIcon, Stack, Typography} from '@mui/material'
import {type ReactNode, createContext, useEffect, useState, useMemo} from 'react'
import {newline} from './lib/utils'
import {loadResource, saveResource, setStorage} from './storage'
import type {NumberObject} from './building'
import {decompress} from './lib/compression'

type AssociatedIndices = [number | number[], (number | number[])?][]
type ConceptNet = {
  terms: {[index: string]: {[index: string]: number | number[]}}
  links: {[index: string]: string | string[]}
}
export type Synset = {
  id: string
  index: number
  count: number
  definition: string
  topic: string
  ili: string
  sense_index: number
  nltk_id: string
  babelnet: string
  source: string
  wikidata: string
  csi_labels: string | string[]
  members: number | number[]
  attribute: number | number[]
  domain_topic: number | number[]
  similar: number | number[]
  also: number | number[]
  domain_region: number | number[]
  exemplifies: number | number[]
  mero_part: number | number[]
  hypernym: number | number[]
  instance_hypernym: number | number[]
  mero_member: number | number[]
  mero_substance: number | number[]
  entails: number | number[]
  causes: number | number[]
  derivation: number | number[]
  pertainym: number | number[]
  agent: number | number[]
  antonym: number | number[]
  body_part: number | number[]
  by_means_of: number | number[]
  destination: number | number[]
  event: number | number[]
  instrument: number | number[]
  location: number | number[]
  material: number | number[]
  participle: number | number[]
  property: number | number[]
  result: number | number[]
  state: number | number[]
  undergoer: number | number[]
  uses: number | number[]
  vehicle: number | number[]
  hyponym: number[]
  instance_hyponym: number[]
  domain_topic_members: number[]
}
type Synsets = readonly Synset[]
export type CoarseSenseMap = {[index: string]: string[]}
export type RawSenseMap = {header: string[]; selectedCols: string[]; rows: readonly string[][]; NLTKLabels: boolean}
export type SenseMapSetterFun = (
  map: CoarseSenseMap,
  options: {rawMap?: RawSenseMap; store: boolean},
  password?: string
) => void
export type TermResources = {
  terms?: readonly string[]
  lemmas?: {[index: string]: number | number[]}
  termLookup?: {[index: string]: number}
  collapsedTerms?: {[index: string]: string}
  termAssociations?: AssociatedIndices
  conceptNet?: ConceptNet
  sense_keys?: readonly string[]
  synsetInfo?: Synsets
  senseMap: CoarseSenseMap
  senseMapOptions: {rawMap?: RawSenseMap; store: boolean}
  SenseLookup: NumberObject
  NLTKLookup: NumberObject
  collapsedSenses: string
  collapsedNLTK: string
}
export const ResourceContext = createContext<TermResources>({
  senseMap: {},
  senseMapOptions: {store: true},
  SenseLookup: {},
  NLTKLookup: {},
  collapsedSenses: '',
  collapsedNLTK: '',
})
export const SenseMapSetter = createContext<SenseMapSetterFun>(
  (map: CoarseSenseMap, options: {rawMap?: RawSenseMap; store: boolean}, password?: string) => {}
)

const resources = [
  {key: 'terms', label: 'Terms'},
  {key: 'termAssociations', label: 'Term Associations'},
  {key: 'conceptNet', label: 'ConceptNet'},
  {key: 'sense_keys', label: 'Sense Keys'},
  {key: 'synsetInfo', label: 'Synset Info'},
] as const

function backLink(
  entry: 'hypernym' | 'instance_hypernym' | 'domain_topic',
  targetEntry: 'hyponym' | 'instance_hyponym' | 'domain_topic_members',
  synset: Synset,
  synsets: Partial<Synset>[]
) {
  if (entry in synset) {
    const sourceEntry = synset[entry]
    const targets = 'number' === typeof sourceEntry ? [sourceEntry] : sourceEntry
    targets.forEach(ti => {
      const target = synsets[ti]
      const out = target[targetEntry]
      if (out) {
        out.push(synset.index + 1)
      } else {
        target[targetEntry] = [synset.index + 1]
      }
    })
  }
}

const wordSep = /[\s-]+/g
export function Resources({children}: {children: ReactNode}) {
  const [terms, setTerms] = useState<readonly string[]>()
  const [lemmas, setLemmas] = useState<{[index: string]: number | number[]}>()
  const [termLookup, setTermLookup] = useState<{[index: string]: number}>()
  const [collapsedTerms, setCollapsedTerms] = useState<{[index: string]: string}>()
  const [termAssociations, setTermAssociations] = useState<AssociatedIndices>()
  const [conceptNet, setConceptNet] = useState<ConceptNet>()
  const [sense_keys, setSenseKeys] = useState<readonly string[]>()
  const [synsetInfo, setSynsetInfo] = useState<Synsets>()
  const [senseMap, setSenseMap] = useState<CoarseSenseMap>({})
  const [senseMapOptions, setSenseMapOptions] = useState<{rawMap?: RawSenseMap; store: boolean}>({store: true})
  const [SenseLookup, setSenseLookup] = useState<NumberObject>({})
  const [NLTKLookup, setNLTKLookup] = useState<NumberObject>({})
  const [collapsedSenses, setCollapsedSenses] = useState('')
  const [collapsedNLTK, setCollapsedNLTK] = useState('')

  const [loadingTerms, setLoadingTerms] = useState(true)
  const [loadingTermAssociations, setLoadingTermAssociations] = useState(true)
  const [loadingConceptNet, setLoadingConceptNet] = useState(true)
  const [loadingSenseKeys, setLoadingSenseKeys] = useState(true)
  const [loadingSynsetInfo, setLoadingSynsetInfo] = useState(true)

  useEffect(() => {
    loadResource('terms').then(res => {
      if (res && res.content) {
        decompress(res.content).then(processedTerms => {
          setTerms(Object.freeze(processedTerms.arr))
          setTermLookup(Object.freeze(processedTerms.obj))
          setCollapsedTerms(Object.freeze(processedTerms.collapsed))
          setLoadingTerms(false)
        })
      } else {
        fetch('/dictionary_builder/data/terms.txt')
          .then(async res => {
            if (!res.ok) throw 'failed to fetch terms: ' + res.status + ' (' + res.statusText + ')'
            const data = await res.text()
            const arr = Object.freeze(data.split(newline))
            setTerms(arr)
            const collapsed: {[index: string]: string} = {
              all: ';;' + arr.join(';;') + ';;',
            }

            const obj: {[index: string]: number} = {}

            arr.forEach((term, index) => {
              obj[term] = index
              const initial = term[0]
              if (initial) {
                if (initial in collapsed) {
                  collapsed[initial] += term + ';;'
                } else {
                  collapsed[initial] = ';;' + term + ';;'
                }
              }
            })
            setTermLookup(Object.freeze(obj))
            setCollapsedTerms(Object.freeze(collapsed))
            saveResource('terms', {arr, obj, collapsed})
          })
          .finally(() => setLoadingTerms(false))
      }
    })
  }, [setLoadingTerms])
  useEffect(() => {
    loadResource('term_associations').then(res => {
      if (res && res.content) {
        decompress(res.content).then(data => {
          setTermAssociations(data)
          setLoadingTermAssociations(false)
        })
      } else {
        fetch('/dictionary_builder/data/term_associations.json')
          .then(async res => {
            if (!res.ok) throw 'failed to fetch term associations: ' + res.status + ' (' + res.statusText + ')'
            const data = await res.json()
            setTermAssociations(data)
            saveResource('term_associations', data)
          })
          .finally(() => setLoadingTermAssociations(false))
      }
    })
  }, [setLoadingTermAssociations])
  useEffect(() => {
    loadResource('conceptnet').then(res => {
      if (res && res.content) {
        decompress(res.content).then(data => {
          setConceptNet(data)
          setLoadingConceptNet(false)
        })
      } else {
        fetch('/dictionary_builder/data/conceptnet.json')
          .then(async res => {
            if (!res.ok) throw 'failed to fetch ConceptNet: ' + res.status + ' (' + res.statusText + ')'
            const data = await res.json()
            setConceptNet(data)
            saveResource('conceptnet', data)
          })
          .finally(() => setLoadingConceptNet(false))
      }
    })
  }, [setLoadingTermAssociations])
  useEffect(() => {
    loadResource('sense_keys').then(res => {
      if (res && res.content) {
        decompress(res.content).then(keys => {
          setSenseKeys(Object.freeze(keys))
          setLoadingSenseKeys(false)
        })
      } else {
        fetch('/dictionary_builder/data/sense_keys.txt')
          .then(async res => {
            if (!res.ok) throw 'failed to fetch sense keys: ' + res.status + ' (' + res.statusText + ')'
            const data = await res.text()
            const senseKeys = data.split(newline)
            setSenseKeys(Object.freeze(senseKeys))
            saveResource('sense_keys', senseKeys)
          })
          .finally(() => setLoadingSenseKeys(false))
      }
    })
  }, [setLoadingSenseKeys])
  useEffect(() => {
    loadResource('synset_info').then(res => {
      if (res && res.content) {
        decompress(res.content).then(info => {
          setSynsetInfo(info)
          setLoadingSynsetInfo(false)
        })
      } else {
        fetch('/dictionary_builder/data/synset_info.json')
          .then(async res => {
            if (!res.ok) throw 'failed to fetch synsets: ' + res.status + ' (' + res.statusText + ')'
            const data = await res.json()
            const synsetInfo = data.map((d: Synset, i: number) => {
              d.index = i
              backLink('hypernym', 'hyponym', d, data)
              backLink('instance_hypernym', 'instance_hyponym', d, data)
              backLink('domain_topic', 'domain_topic_members', d, data)
              return d
            })
            setSynsetInfo(synsetInfo)
            saveResource('synset_info', synsetInfo)
          })
          .finally(() => setLoadingSynsetInfo(false))
      }
    })
  }, [setLoadingSynsetInfo])
  useEffect(() => {
    if (terms && termAssociations) {
      const tempLemmas: {[index: string]: number | number[]} = {}
      termAssociations.forEach((termIndices, index) => {
        if (termIndices.length) {
          const associatedTerms = termIndices[0]
          const lemmaIndex =
            'number' === typeof associatedTerms ? associatedTerms : associatedTerms.length ? associatedTerms[0] : 0
          if (lemmaIndex) {
            const term = terms[index]
            const lemma = terms[lemmaIndex - 1]
            const existing = tempLemmas[lemma]
            if (existing && !('function' === typeof existing)) {
              if ('number' === typeof existing) {
                tempLemmas[lemma] = [lemmaIndex - 1, existing, index]
              } else {
                existing.push(index)
              }
            } else {
              tempLemmas[lemma] = [lemmaIndex - 1, index]
            }
            tempLemmas[term] = lemmaIndex - 1
          }
        }
      })
      setLemmas(tempLemmas)
    }
  }, [terms, termAssociations])
  useEffect(() => {
    if (terms && sense_keys && synsetInfo) {
      const sense_lookup: NumberObject = {}
      const nltk_lookup: NumberObject = {}
      synsetInfo.forEach((synset, index) => {
        sense_lookup[sense_keys[index]] = index
        if (synset.sense_index && synset.members) {
          const senseIndex = synset.sense_index + ''
          const firstMemberIndex = 'number' === typeof synset.members ? synset.members : synset.members[0]
          if (firstMemberIndex) {
            const nltkId =
              terms[firstMemberIndex - 1].replace(wordSep, '_') +
              '.' +
              synset.id.substring(synset.id.length - 1) +
              '.' +
              (senseIndex.length === 1 ? '0' : '') +
              senseIndex
            nltk_lookup[nltkId] = index
            synset.nltk_id = nltkId
          }
        }
      })
      setSenseLookup(sense_lookup)
      setNLTKLookup(nltk_lookup)
      setCollapsedSenses(';;' + sense_keys.join(';;') + ';;')
      setCollapsedNLTK(';;' + Object.keys(nltk_lookup).join(';;') + ';;')
    }
  }, [terms, sense_keys, synsetInfo])
  const Data = useMemo(() => {
    return {
      terms,
      lemmas,
      termLookup,
      collapsedTerms,
      termAssociations,
      conceptNet,
      sense_keys,
      synsetInfo,
      senseMap,
      senseMapOptions,
      NLTKLookup,
      SenseLookup,
      collapsedSenses,
      collapsedNLTK,
    } as TermResources
  }, [
    terms,
    lemmas,
    termLookup,
    collapsedTerms,
    termAssociations,
    conceptNet,
    sense_keys,
    synsetInfo,
    senseMap,
    senseMapOptions,
    NLTKLookup,
    SenseLookup,
    collapsedSenses,
    collapsedNLTK,
  ])
  const loading = {
    terms: loadingTerms,
    termAssociations: loadingTermAssociations,
    conceptNet: loadingConceptNet,
    sense_keys: loadingSenseKeys,
    synsetInfo: loadingSynsetInfo,
  }
  return (
    <ResourceContext.Provider value={Data}>
      {lemmas && synsetInfo ? (
        <SenseMapSetter.Provider
          value={(map: CoarseSenseMap, options: {rawMap?: RawSenseMap; store: boolean}, password?: string) => {
            setSenseMap(map)
            if (options.store) {
              setStorage('coarse_sense_map', '', map, true, password)
            }
            if (options.rawMap) {
              setSenseMapOptions(options)
              if (options.store) setStorage('coarse_sense_map', 'original_', options.rawMap, true, password)
            }
          }}
        >
          {children}
        </SenseMapSetter.Provider>
      ) : (
        <Stack sx={{margin: 'auto', marginTop: 10, maxWidth: 350}}>
          <Typography variant="h4">Loading Resources...</Typography>
          <List>
            {resources.map(({key, label}) => (
              <ListItem key={key} dense>
                <ListItemIcon sx={{minWidth: '35px', mb: 1}}>
                  {Data[key] ? (
                    <Done color="success" />
                  ) : loading[key] ? (
                    <CircularProgress size="1.5rem" />
                  ) : (
                    <Error color="error" sx={{marginBottom: -0.8}} />
                  )}
                </ListItemIcon>
                <Typography>
                  {!Data[key] && !loading[key] ? 'Failed to load ' : ''}
                  {label}
                </Typography>
              </ListItem>
            ))}
          </List>
        </Stack>
      )}
    </ResourceContext.Provider>
  )
}
