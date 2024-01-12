import {Box, LinearProgress, Stack, Typography} from '@mui/material'
import {PlotOptions, ProcessOptions, TermEntry} from './analysisMenu'
import {useContext, useEffect, useMemo, useState} from 'react'
import {Graph} from './graph'
import {getProcessedTerm} from './processTerms'
import {FixedTerm} from './term'
import {ResourceContext} from './resources'
import {BuildContext} from './building'
import {timers} from './addedTerms'

function getSimilarity(a: TermEntry, b: TermEntry, options: ProcessOptions) {
  const term = a.term
  const sim = {
    lemma: +(term in b.processed.lookup.lemma),
    lemma_related: +(term in b.processed.lookup.lemma_related),
    lemma_synset: +(term in b.processed.lookup.lemma_synset),
    related: +(term in b.processed.lookup.related),
    related_lemma: +(term in b.processed.lookup.related_lemma),
    related_related: +(term in b.processed.lookup.related_related),
    related_synset: +(term in b.processed.lookup.related_synset),
    synset: +(term in b.processed.lookup.synset),
    synset_lemma: +(term in b.processed.lookup.synset_lemma),
    synset_related: +(term in b.processed.lookup.synset_related),
    synset_synset: +(term in b.processed.lookup.synset_synset),
  }
  const weighted = options.dense
    ? 0.7 * sim.lemma +
      0.001 * sim.lemma_related +
      0.5 * sim.lemma_synset +
      0.5 * sim.related +
      0.01 * sim.related_lemma +
      0.001 * sim.related_related +
      0.1 * sim.related_synset +
      0.7 * sim.synset +
      0.5 * sim.synset_lemma +
      0.001 * sim.synset_related +
      0.4 * sim.synset_synset
    : 1 * sim.lemma + 0.1 * sim.related + 1 * sim.synset
  return weighted > options.min_sim ? weighted : 0
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
  a: number,
  b: number,
  terms: TermEntry[],
  edges: Edge[],
  progress: (perc: number) => void,
  finish: (data: {edges: Edge[]; nodes: Node[]}) => void,
  options: ProcessOptions
) {
  clearTimeout(timers.comparisons)
  const n = terms.length
  const nComps = ((n - 1) / 2) * n
  for (let step = 0; i < nComps && step < 10000; step++, i++, b++) {
    if (b >= n) {
      if (++a >= n) a = Math.trunc(i / (n - 1))
      b = a + 1
    }
    const value = getSimilarity(terms[a], terms[b], options)
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
  if (i < nComps) {
    timers.comparisons = setTimeout(() => processComparisons(i, a, b, terms, edges, progress, finish, options), 0)
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
  progress(i / nComps)
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
      const processed = getProcessedTerm(term, data, dict, true)
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
              processed: getProcessedTerm(match, data, {}, true) as FixedTerm,
            })
          }
        })
      }
    })
    return out
  }, [dict, data, options])

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
    processComparisons(0, 0, 1, terms, edges, setProgress, setNetwork, options)
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
