import {Done, Error} from '@mui/icons-material'
import {CircularProgress, List, ListItem, Stack, Typography} from '@mui/material'
import {type ReactNode, createContext, useEffect, useState} from 'react'

type AssociatedIndices = {[index: string]: [number | number[], (number | number[])?]}
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
    fetch('/dictionary_builder/data/terms.txt')
      .then(res => res.text())
      .then(data => {
        const arr = Object.freeze(data.split('\n'))
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
      })
      .finally(() => setLoadingTerms(false))
  }, [setLoadingTerms])
  useEffect(() => {
    fetch('/dictionary_builder/data/term_associations.json')
      .then(res => res.json())
      .then(data => {
        setTermAssociations(data)
      })
      .finally(() => setLoadingTermAssociations(false))
  }, [setLoadingTermAssociations])
  useEffect(() => {
    fetch('/dictionary_builder/data/sense_keys.txt')
      .then(res => res.text())
      .then(data => {
        setSenseKeys(Object.freeze(data.split('\n')))
      })
      .finally(() => setLoadingSenseKeys(false))
  }, [setLoadingSenseKeys])
  useEffect(() => {
    fetch('/dictionary_builder/data/synset_info.json')
      .then(res => res.json())
      .then(data => {
        setSynsetInfo(
          data.map((d: Synset, i: number) => {
            d.index = i
            return d
          })
        )
      })
      .finally(() => setLoadingSynsetInfo(false))
  }, [setLoadingSynsetInfo])
  const Data = {terms, termLookup, collapsedTerms, termAssociations, sense_keys, synsetInfo}
  const loading = {
    terms: loadingTerms,
    termAssociations: loadingTermAssociations,
    sense_keys: loadingSenseKeys,
    synsetInfo: loadingSynsetInfo,
  }
  return (
    <ResourceContext.Provider value={Data}>
      {termAssociations && synsetInfo ? (
        children
      ) : (
        <Stack sx={{margin: 'auto', marginTop: 10, maxWidth: 350}}>
          <Typography>Loading Resources...</Typography>
          <List>
            {resources.map(({key, label}) => (
              <ListItem key={key}>
                <Typography>
                  {Data[key] ? (
                    <Done color="success" />
                  ) : loading[key] ? (
                    <CircularProgress size="1.5rem" />
                  ) : (
                    <Error color="error" sx={{marginBottom: -0.8}} />
                  )}
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
