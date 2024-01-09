import {Box, LinearProgress, Stack, Typography} from '@mui/material'
import {PlotOptions, ProcessOptions, TermEntry} from './analysisMenu'
import {useContext, useEffect, useMemo, useState} from 'react'
import {Graph} from './graph'
import {getProcessedTerm} from './processTerms'
import {FixedTerm} from './term'
import {ResourceContext} from './resources'
import {BuildContext} from './building'

const comparisons: {[index: string]: {[index: string]: {lemma: number; related: number; synset: number}}} = {}
function getSimilarity(a: TermEntry, b: TermEntry) {
  const term = a.term
  if (!(term in comparisons)) comparisons[term] = {}
  const comp = comparisons[term]
  if (!(b.term in comp)) {
    comp[b.term] = {
      lemma: +(term in b.processed.lookup.lemma),
      related: +(term in b.processed.lookup.related),
      synset: +(term in b.processed.lookup.synset),
    }
  }
  const sim = comp[b.term]
  return sim.lemma + 0.4 * sim.related + 0.3 * sim.synset
}
export type Edge = {
  source: string
  source_index: number
  target: string
  target_index: number
  value: number
  lineStyle: {width: number; opacity: number}
}
export type Node = {
  x: number
  y: number
  category: string | string[]
  host: string
  name: string
  value: number
  prop: number
  symbolSize: number
  itemStyle: {
    opacity: number
  }
  label: {
    show: boolean
  }
}
async function processComparisons(
  i: number,
  terms: TermEntry[],
  edges: Edge[],
  progress: (perc: number) => void,
  finish: (data: {edges: Edge[]; nodes: Node[]}) => void,
  options: ProcessOptions
) {
  const n = terms.length
  const nComps = (n / 2) * (n - 1)
  for (let step = 0, b = Math.trunc(i / n) + 1; i < nComps && step < 10000; step++, i++, b++) {
    const a = Math.trunc(i / n)
    if (b >= n) b = a + 1
    const value = getSimilarity(terms[a], terms[b])
    if (value)
      edges.push({
        source: terms[a].term,
        source_index: a,
        target: terms[b].term,
        target_index: b,
        value,
        lineStyle: {width: 0.3 + value * 2, opacity: 0.35},
      })
  }
  const completed = i / nComps
  if (completed < 1) {
    setTimeout(() => processComparisons(i, terms, edges, progress, finish, options), 0)
  } else {
    const nodes: Node[] = terms.map(term => {
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        host: term.host || '',
        category: Object.keys(term.categories),
        name: term.term,
        prop: 1,
        value: 0,
        symbolSize: 10,
        itemStyle: {
          opacity: 1,
        },
        label: {
          show: true,
        },
      }
    })
    edges.forEach(edge => {
      nodes[edge.source_index].value += edge.value
      nodes[edge.target_index].value += edge.value
    })
    let max = 0
    nodes.forEach(({value}) => {
      if (value > max) max = value
    })
    finish({
      edges,
      nodes: nodes.map(node => {
        node.prop = node.value / max
        node.x *= 1 - node.prop
        node.y *= 1 - node.prop
        node.itemStyle = {opacity: 0.6 + node.prop * 0.4}
        return node
      }),
    })
  }
  progress(completed)
}

export function Results({
  selectedCategories,
  options,
  plotOptions,
}: {
  selectedCategories: string[]
  options: ProcessOptions
  plotOptions: PlotOptions
}) {
  const data = useContext(ResourceContext)
  const dict = useContext(BuildContext)

  const allTerms = useMemo(() => {
    const entered: {[index: string]: boolean} = {}
    const out: TermEntry[] = []
    Object.keys(dict).forEach(term => {
      const processed = getProcessedTerm(term, data, dict)
      if (processed.type === 'fixed') {
        if (!(term in entered)) {
          entered[term] = true
          out.push({term, categories: dict[term].categories, processed})
        }
      } else if (options.include_fuzzy) {
        processed.matches.forEach(match => {
          if (!(match in dict) && !(match in entered)) {
            entered[match] = true
            out.push({
              host: term,
              term: match,
              categories: dict[term].categories,
              processed: getProcessedTerm(match, data) as FixedTerm,
            })
          }
        })
      }
    })
    return out
  }, [dict, data, options.include_fuzzy])

  const [network, setNetwork] = useState<{edges: Edge[]; nodes: Node[]}>({edges: [], nodes: []})
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const selectedMap = new Map(selectedCategories.map((cat, index) => [index, cat]))
    const terms: TermEntry[] = []
    allTerms.forEach(term => {
      let keep = false
      const cats: {[index: string]: number} = {}
      selectedMap.forEach(cat => {
        if (cat in term.categories) {
          keep = true
          cats[cat] = term.categories[cat]
        }
      })
      if (keep) terms.push({...term, categories: cats})
    })
    const edges: Edge[] = []
    processComparisons(0, terms, edges, setProgress, setNetwork, options)
  }, [allTerms, selectedCategories])

  return progress < 1 ? (
    <Box sx={{position: 'relative', width: '100%', height: '100%'}}>
      <Box
        sx={{
          display: 'flex',
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <Stack>
          <Typography variant="h5">Calculating Pairwise Similarities</Typography>
          <LinearProgress variant="determinate" value={progress * 100}></LinearProgress>
          <Typography variant="caption">{Math.round(progress * 100) + '%'}</Typography>
        </Stack>
      </Box>
    </Box>
  ) : (
    <Box sx={{position: 'relative', width: '100%', height: '100%'}}>
      <Graph nodes={network.nodes} edges={network.edges} options={plotOptions} />
    </Box>
  )
}
