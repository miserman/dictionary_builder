import {Box, LinearProgress, Stack, Typography} from '@mui/material'
import {PlotOptions, ProcessOptions, TermEntry} from './analysisMenu'
import {useEffect, useState} from 'react'
import {Graph} from './plot'

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
export type Edge = {source: number; target: number; value: number}
export type Node = {category: string; host: string; name: string; value: number}
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
    if (value) edges.push({source: a, target: b, value})
  }
  const completed = i / nComps
  if (completed < 1) {
    setTimeout(() => processComparisons(i, terms, edges, progress, finish, options), 0)
  } else {
    const nodes: Node[] = terms.map(term => {
      return {
        host: term.host || '',
        category: Object.keys(term.categories)[0],
        name: (term.host ? '(' + term.host + ') ' : '') + term.term,
        value: 0,
      }
    })
    edges.forEach(edge => {
      nodes[edge.source].value += 1
      nodes[edge.target].value += 1
    })
    finish({edges, nodes})
  }
  progress(completed)
}

export function Results({
  terms,
  categories,
  options,
  plotOptions,
}: {
  terms: TermEntry[]
  categories: string[]
  options: ProcessOptions
  plotOptions: PlotOptions
}) {
  const [data, setData] = useState<{edges: Edge[]; nodes: Node[]}>({edges: [], nodes: []})
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const edges: Edge[] = []
    processComparisons(0, terms, edges, setProgress, setData, options)
  }, [terms])
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
      <Graph nodes={data.nodes} edges={data.edges} categories={categories} options={plotOptions} />
    </Box>
  )
}
