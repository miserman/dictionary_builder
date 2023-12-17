import {ReactNode, createContext, useEffect, useState} from 'react'

type AssociatedIndices = {[index: string]: number | number[]}
type Synsets = {[index: string]: string | string[]}
export const ResourceContext = createContext<{
  terms?: string[]
  collapsedTerms?: string
  termAssociations?: AssociatedIndices
  synsets?: string[]
  synsetInfo?: Synsets
}>({})

export function Resources({
  setLoadingTerms,
  setLoadingSynsets,
  children,
}: {
  setLoadingTerms: (loading: boolean) => void
  setLoadingSynsets: (loading: boolean) => void
  children: ReactNode
}) {
  const [terms, setTerms] = useState<string[]>()
  const [collapsedTerms, setCollapsedTerms] = useState<string>()
  const [termAssociations, setTermAssociations] = useState<AssociatedIndices>()
  const [synsets, setSynsets] = useState<string[]>()
  const [synsetInfo, setSynsetInfo] = useState<Synsets>()

  useEffect(() => {
    fetch('/dictionary_builder/data/term_associations.json')
      .then(res => res.json())
      .then(data => {
        const all_terms = Object.keys(data)
        setTerms(all_terms)
        setCollapsedTerms(';;' + all_terms.join(';;') + ';;')
        setTermAssociations(data)
      })
      .finally(() => setLoadingTerms(false))
  }, [setLoadingTerms])
  useEffect(() => {
    fetch('/dictionary_builder/data/synsets.json')
      .then(res => res.json())
      .then(data => {
        setSynsets(Object.keys(data))
        setSynsetInfo(data)
      })
      .finally(() => setLoadingSynsets(false))
  }, [setLoadingSynsets])

  return (
    <ResourceContext.Provider value={{terms, collapsedTerms, termAssociations, synsets, synsetInfo}}>
      {children}
    </ResourceContext.Provider>
  )
}
