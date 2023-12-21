import {ReactNode, createContext, useEffect, useState} from 'react'

type AssociatedIndices = {[index: string]: [number | number[], (number | number[])?]}
export type Synset = {
  index: number
  key: string
  definition: string
  ili: string
  source: string
  wikidata: string
  members: string | string[]
  attribute: string | string[]
  domain_topic: string | string[]
  similar: string | string[]
  also: string | string[]
  domain_region: string | string[]
  exemplifies: string | string[]
  mero_part: string | string[]
  instance_hypernym: string | string[]
  mero_member: string | string[]
  mero_substance: string | string[]
  entails: string | string[]
  causes: string | string[]
}
type Synsets = readonly Synset[]
export type TermResources = {
  terms?: readonly string[]
  termLookup?: {[index: string]: number}
  collapsedTerms?: string
  termAssociations?: AssociatedIndices
  synsets?: readonly string[]
  synsetInfo?: Synsets
}
export const ResourceContext = createContext<TermResources>({})

export function Resources({
  loadingTerms,
  loadingTermAssociations,
  loadingSynsets,
  loadingSynsetInfo,
  children,
}: {
  loadingTerms: (loading: boolean) => void
  loadingTermAssociations: (loading: boolean) => void
  loadingSynsets: (loading: boolean) => void
  loadingSynsetInfo: (loading: boolean) => void
  children: ReactNode
}) {
  const [terms, setTerms] = useState<readonly string[]>()
  const [termLookup, setTermLookup] = useState<{[index: string]: number}>()
  const [collapsedTerms, setCollapsedTerms] = useState<string>()
  const [termAssociations, setTermAssociations] = useState<AssociatedIndices>()
  const [synsets, setSynsets] = useState<readonly string[]>()
  const [synsetInfo, setSynsetInfo] = useState<Synsets>()

  useEffect(() => {
    fetch('/dictionary_builder/data/terms.txt')
      .then(res => res.text())
      .then(data => {
        const arr = Object.freeze(data.split('\n'))
        setTerms(arr)
        const obj: {[index: string]: number} = {}
        arr.forEach((term, index) => (obj[term] = index))
        setTermLookup(Object.freeze(obj))
        setCollapsedTerms(';;' + arr.join(';;') + ';;')
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
    fetch('/dictionary_builder/data/synsets.txt')
      .then(res => res.text())
      .then(data => {
        setSynsets(Object.freeze(data.split('\n')))
      })
      .finally(() => loadingSynsets(false))
  }, [loadingSynsets])
  useEffect(() => {
    fetch('/dictionary_builder/data/synset_info.json')
      .then(res => res.json())
      .then(data => {
        setSynsetInfo(data)
      })
      .finally(() => loadingSynsetInfo(false))
  }, [loadingSynsetInfo])

  return (
    <ResourceContext.Provider value={{terms, termLookup, collapsedTerms, termAssociations, synsets, synsetInfo}}>
      {children}
    </ResourceContext.Provider>
  )
}
