import {ReactNode, createContext, useEffect, useState} from 'react'

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

export function Resources({
  loadingTerms,
  loadingTermAssociations,
  loadingSenseKeys,
  loadingSynsetInfo,
  children,
}: {
  loadingTerms: (loading: boolean) => void
  loadingTermAssociations: (loading: boolean) => void
  loadingSenseKeys: (loading: boolean) => void
  loadingSynsetInfo: (loading: boolean) => void
  children: ReactNode
}) {
  const [terms, setTerms] = useState<readonly string[]>()
  const [termLookup, setTermLookup] = useState<{[index: string]: number}>()
  const [collapsedTerms, setCollapsedTerms] = useState<{[index: string]: string}>()
  const [termAssociations, setTermAssociations] = useState<AssociatedIndices>()
  const [sense_keys, setSenseKeys] = useState<readonly string[]>()
  const [synsetInfo, setSynsetInfo] = useState<Synsets>()

  useEffect(() => {
    fetch('/dictionary_builder/data/terms.txt')
      .then(res => res.text())
      .then(data => {
        const arr = Object.freeze(data.split('\n'))
        setTerms(arr)
        const obj: {[index: string]: number} = {}
        const separated: {[index: string]: string[]} = {
          all: arr as string[],
        }
        let initial = ''
        arr.forEach((term, index) => {
          obj[term] = index
          initial = term[0]
          if (initial) {
            if (initial in separated) {
              separated[initial].push(term)
            } else {
              separated[initial] = [term]
            }
          }
        })
        setTermLookup(Object.freeze(obj))
        const collapsed: {[index: string]: string} = {}
        Object.keys(separated).forEach(k => (collapsed[k] = ';;' + separated[k].join(';;') + ';;'))
        setCollapsedTerms(Object.freeze(collapsed))
      })
      .finally(() => loadingTerms(false))
  }, [loadingTerms])
  useEffect(() => {
    fetch('/dictionary_builder/data/term_associations.json')
      .then(res => res.json())
      .then(data => {
        setTermAssociations(data)
      })
      .finally(() => loadingTermAssociations(false))
  }, [loadingTermAssociations])
  useEffect(() => {
    fetch('/dictionary_builder/data/sense_keys.txt')
      .then(res => res.text())
      .then(data => {
        setSenseKeys(Object.freeze(data.split('\n')))
      })
      .finally(() => loadingSenseKeys(false))
  }, [loadingSenseKeys])
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
      .finally(() => loadingSynsetInfo(false))
  }, [loadingSynsetInfo])

  return (
    <ResourceContext.Provider value={{terms, termLookup, collapsedTerms, termAssociations, sense_keys, synsetInfo}}>
      {children}
    </ResourceContext.Provider>
  )
}
