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
type Synsets = Synset[]
export type TermResources = {
  terms?: string[]
  collapsedTerms?: string
  termAssociations?: AssociatedIndices
  synsets?: string[]
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
  const [terms, setTerms] = useState<string[]>()
  const [collapsedTerms, setCollapsedTerms] = useState<string>()
  const [termAssociations, setTermAssociations] = useState<AssociatedIndices>()
  const [synsets, setSynsets] = useState<string[]>()
  const [synsetInfo, setSynsetInfo] = useState<Synsets>()

  useEffect(() => {
    fetch('/dictionary_builder/data/terms.txt')
      .then(res => res.text())
      .then(data => {
        const arr = data.split('\n')
        setTerms(arr)
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
        setSynsets(data.split('\n'))
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
    <ResourceContext.Provider value={{terms, collapsedTerms, termAssociations, synsets, synsetInfo}}>
      {children}
    </ResourceContext.Provider>
  )
}
