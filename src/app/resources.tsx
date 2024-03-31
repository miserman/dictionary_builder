import {Done, Error} from '@mui/icons-material'
import {CircularProgress, List, ListItem, ListItemIcon, Stack, Typography} from '@mui/material'
import {type ReactNode, createContext, useEffect, useState, useMemo} from 'react'
import {newline} from './lib/utils'
import {loadResource, saveResource, setStorage} from './storage'
import type {NumberObject} from './building'
import {decompress} from './lib/compression'

type AssociatedIndices = [number | number[], (number | number[])?][]
export type Synset = {
  id: string
  index: number
  definition: string
  topic: string
  ili: string
  sense_index: number
  nltk_id: string
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
  instance_hypernym: number | number[]
  mero_member: number | number[]
  mero_substance: number | number[]
  entails: number | number[]
  causes: number | number[]
}
type Synsets = readonly Synset[]
export type CoarseSenseMap = {[index: string]: string[]}
export type RawSenseMap = {header: string[]; selectedCols: string[]; rows: readonly string[][]; NLTKLabels: boolean}
export type TermResources = {
  terms?: readonly string[]
  lemmas?: {[index: string]: number | number[]}
  termLookup?: {[index: string]: number}
  collapsedTerms?: {[index: string]: string}
  termAssociations?: AssociatedIndices
  sense_keys?: readonly string[]
  synsetInfo?: Synsets
  senseMap: CoarseSenseMap
  senseMapRaw?: RawSenseMap
  SenseLookup: NumberObject
  NLTKLookup: NumberObject
  collapsedSenses: string
  collapsedNLTK: string
}
export const ResourceContext = createContext<TermResources>({
  senseMap: {},
  SenseLookup: {},
  NLTKLookup: {},
  collapsedSenses: '',
  collapsedNLTK: '',
})
export const SenseMapSetter = createContext(
  (map: CoarseSenseMap, rawMap: RawSenseMap | void, store?: boolean, password?: string) => {}
)

const resources = [
  {key: 'terms', label: 'Terms'},
  {key: 'termAssociations', label: 'Term Associations'},
  {key: 'sense_keys', label: 'Sense Keys'},
  {key: 'synsetInfo', label: 'Synset Info'},
] as const

const wordSep = /[\s-]+/g
export function Resources({children}: {children: ReactNode}) {
  const [terms, setTerms] = useState<readonly string[]>()
  const [lemmas, setLemmas] = useState<{[index: string]: number | number[]}>()
  const [termLookup, setTermLookup] = useState<{[index: string]: number}>()
  const [collapsedTerms, setCollapsedTerms] = useState<{[index: string]: string}>()
  const [termAssociations, setTermAssociations] = useState<AssociatedIndices>()
  const [sense_keys, setSenseKeys] = useState<readonly string[]>()
  const [synsetInfo, setSynsetInfo] = useState<Synsets>()
  const [senseMap, setSenseMap] = useState<CoarseSenseMap>({})
  const [senseMapRaw, setSenseMapRaw] = useState<RawSenseMap | void>()
  const [SenseLookup, setSenseLookup] = useState<NumberObject>({})
  const [NLTKLookup, setNLTKLookup] = useState<NumberObject>({})
  const [collapsedSenses, setCollapsedSenses] = useState('')
  const [collapsedNLTK, setCollapsedNLTK] = useState('')

  const [loadingTerms, setLoadingTerms] = useState(true)
  const [loadingTermAssociations, setLoadingTermAssociations] = useState(true)
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
          .then(res => res.text())
          .then(data => {
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
          .then(res => res.json())
          .then(data => {
            setTermAssociations(data)
            saveResource('term_associations', data)
          })
          .finally(() => setLoadingTermAssociations(false))
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
          .then(res => res.text())
          .then(data => {
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
          .then(res => res.json())
          .then(data => {
            const synsetInfo = data.map((d: Synset, i: number) => {
              d.index = i
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
      sense_keys,
      synsetInfo,
      senseMap,
      senseMapRaw,
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
    sense_keys,
    synsetInfo,
    senseMap,
    senseMapRaw,
    NLTKLookup,
    SenseLookup,
    collapsedSenses,
    collapsedNLTK,
  ])
  const loading = {
    terms: loadingTerms,
    termAssociations: loadingTermAssociations,
    sense_keys: loadingSenseKeys,
    synsetInfo: loadingSynsetInfo,
  }
  return (
    <ResourceContext.Provider value={Data}>
      {lemmas && synsetInfo ? (
        <SenseMapSetter.Provider
          value={(map: CoarseSenseMap, rawMap: RawSenseMap | void, store?: boolean, password?: string) => {
            setSenseMap(map)
            if (store) {
              setStorage('coarse_sense_map', '', map, true, password)
            }
            if (rawMap) {
              setSenseMapRaw(rawMap)
              if (store) setStorage('coarse_sense_map', 'original_', rawMap, true, password)
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
