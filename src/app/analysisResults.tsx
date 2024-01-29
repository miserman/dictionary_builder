import {Box, LinearProgress, Stack, Typography} from '@mui/material'
import type {PlotOptions, ProcessOptions, TermEntry} from './analysisMenu'
import {useContext, useEffect, useState} from 'react'
import {Graph} from './graph'
import {getProcessedTerm} from './processTerms'
import type {FixedTerm, NetworkLookup} from './term'
import {ResourceContext} from './resources'
import {BuildContext} from './building'
import {timers} from './addedTerms'
import {DictEntry} from './storage'

export function getIntersects(a: string, b: NetworkLookup) {
  return {
    lemma: +(a in b.lemma),
    lemma_related: +(a in b.lemma_related),
    lemma_synset: +(a in b.lemma_synset),
    related: +(a in b.related),
    related_lemma: +(a in b.related_lemma),
    related_related: +(a in b.related_related),
    related_synset: +(a in b.related_synset),
    synset: +(a in b.synset),
    synset_lemma: +(a in b.synset_lemma),
    synset_related: +(a in b.synset_related),
    synset_synset: +(a in b.synset_synset),
  }
}
function getSimilarity(a: TermEntry, b: TermEntry, dense: boolean) {
  if (!b.processed) return 0
  const sim = getIntersects(a.term, b.processed.lookup)
  return dense
    ? 0.35 * sim.lemma +
        0.1 * sim.lemma_related +
        0.001 * sim.lemma_synset +
        0.25 * sim.related +
        0.1 * sim.related_lemma +
        0.001 * sim.related_related +
        0.001 * sim.related_synset +
        0.001 * sim.synset +
        0.001 * sim.synset_lemma +
        0.001 * sim.synset_related +
        0.001 * sim.synset_synset
    : 0.35 * sim.lemma + 0.25 * sim.related + 0.001 * sim.synset
}
export type Edge = {
  source: string
  target: string
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
  terms: {[index: string]: TermEntry},
  edges: Edge[],
  record: {[index: string]: boolean},
  progress: (progress: number[]) => void,
  finish: (data: {edges: Edge[]; nodes: Node[]}) => void,
  options: ProcessOptions
) {
  clearTimeout(timers.comparisons)
  const termKeys = Object.keys(terms)
  const n = termKeys.length
  for (let step = 0; i < n && step < 100; step++, i++) {
    const term = terms[termKeys[i]]
    term.processed.lookup.map.forEach((_, child) => {
      const key = term.term + '.' + child
      const rkey = child + '.' + term.term
      if (term.term !== child && !(key in record) && !(rkey in record) && child in terms) {
        record[key] = record[rkey] = true
        const value = getSimilarity(term, terms[child], options.dense)
        if (value > options.min_sim)
          edges.push({
            source: term.term,
            target: child,
            value: value,
            lineStyle: {width: 0.3 + value * 2, opacity: 0.35},
          })
      }
    })
  }
  progress([i, n])
  if (i < n) {
    timers.comparisons = setTimeout(() => processComparisons(i, terms, edges, record, progress, finish, options), 0)
  } else {
    setTimeout(() => {
      const nodeIndices: {[index: string]: number} = {}
      const nodes: Node[] = Object.values(terms).map((term, index) => {
        nodeIndices[term.term] = index
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
        nodes[nodeIndices[edge.source]].value += edge.value
        nodes[nodeIndices[edge.target]].value += edge.value
      })
      let max = 0
      nodes.forEach(({value}) => {
        if (value > max) max = value
      })
      finish({
        edges,
        nodes: nodes.map(node => {
          node.prop = node.value / max
          node.itemStyle = {opacity: 0.6 + node.prop * 0.4}
          return node
        }),
      })
    }, 0)
  }
}

export function Results({
  allTerms,
  selectedCategories,
  options,
  plotOptions,
}: {
  allTerms: Map<string, DictEntry>
  selectedCategories: string[]
  options: ProcessOptions
  plotOptions: PlotOptions
}) {
  const data = useContext(ResourceContext)
  const dict = useContext(BuildContext)

  const [network, setNetwork] = useState<{edges: Edge[]; nodes: Node[]}>({edges: [], nodes: []})
  const [progress, setProgress] = useState([0, 0])

  useEffect(() => {
    const selectedMap = new Map(selectedCategories.map((cat, index) => [index, cat]))
    const terms: {[index: string]: TermEntry} = {}
    allTerms.forEach((entry, term) => {
      let keep = false
      const cats: {[index: string]: number} = {}
      selectedMap.forEach(cat => {
        if (cat in entry.categories || (cat === 'no categories' && !Object.keys(entry.categories).length)) {
          keep = true
          cats[cat] = entry.categories[cat]
        }
      })
      if (keep) {
        const processed = getProcessedTerm(term, data, dict, true)
        if (processed.type === 'fixed') {
          if (!(term in terms)) {
            terms[term] = {term, categories: cats, processed}
          }
        } else if (options.include_fuzzy) {
          processed.matches.forEach(match => {
            if (!(match in dict) && !(match in terms)) {
              terms[match] = {
                host: term,
                term: match,
                categories: cats,
                processed: getProcessedTerm(match, data, {}, true) as FixedTerm,
              }
            }
          })
        }
      }
    })
    const record: {[index: string]: boolean} = {}
    const edges: Edge[] = []
    processComparisons(0, terms, edges, record, setProgress, setNetwork, options)
  }, [dict, data, options, selectedCategories])
  return progress[0] < progress[1] ? (
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
          <LinearProgress variant="determinate" value={(progress[0] / progress[1]) * 100} />
          <Typography variant="caption">{progress[0] + ' / ' + progress[1]}</Typography>
        </Stack>
      </Box>
    </Box>
  ) : (
    <Box sx={{position: 'relative', width: '100%', height: '100%'}}>
      <Graph nodes={network.nodes} edges={network.edges} options={plotOptions} />
    </Box>
  )
}
