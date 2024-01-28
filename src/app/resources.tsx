import {Done, Error} from '@mui/icons-material'
import {CircularProgress, List, ListItem, ListItemIcon, Stack, Typography} from '@mui/material'
import {type ReactNode, createContext, useEffect, useState, useMemo} from 'react'
import {newline} from './utils'
import {decompress, loadResource, saveResource} from './storage'

type AssociatedIndices = [number | number[], (number | number[])?][]
export type Synset = {
  id: string
  index: number
  definition: string
  topic: string
  ili: string
  source: string
  wikidata: string
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
export type TermResources = {
  terms?: readonly string[]
  lemmas?: {[index: string]: number | number[]}
  termLookup?: {[index: string]: number}
  collapsedTerms?: {[index: string]: string}
  termAssociations?: AssociatedIndices
  sense_keys?: readonly string[]
  synsetInfo?: Synsets
}
export const ResourceContext = createContext<TermResources>({})

const resources = [
  {key: 'terms', label: 'Terms'},
  {key: 'termAssociations', label: 'Term Associations'},
  {key: 'sense_keys', label: 'Sense Keys'},
  {key: 'synsetInfo', label: 'Synset Info'},
] as const

export function Resources({children}: {children: ReactNode}) {
  const [terms, setTerms] = useState<readonly string[]>()
  const [lemmas, setLemmas] = useState<{[index: string]: number | number[]}>()
  const [termLookup, setTermLookup] = useState<{[index: string]: number}>()
  const [collapsedTerms, setCollapsedTerms] = useState<{[index: string]: string}>()
  const [termAssociations, setTermAssociations] = useState<AssociatedIndices>()
  const [sense_keys, setSenseKeys] = useState<readonly string[]>()
  const [synsetInfo, setSynsetInfo] = useState<Synsets>()

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
  const Data = useMemo(() => {
    return {terms, lemmas, termLookup, collapsedTerms, termAssociations, sense_keys, synsetInfo}
  }, [terms, lemmas, termLookup, collapsedTerms, termAssociations, sense_keys, synsetInfo])
  const loading = {
    terms: loadingTerms,
    termAssociations: loadingTermAssociations,
    sense_keys: loadingSenseKeys,
    synsetInfo: loadingSynsetInfo,
  }
  return (
    <ResourceContext.Provider value={Data}>
      {lemmas && synsetInfo ? (
        children
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
