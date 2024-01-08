import {use, init, getInstanceByDom} from 'echarts/core'
import {TooltipComponent, LegendComponent} from 'echarts/components'
import {GraphChart} from 'echarts/charts'
import {CanvasRenderer} from 'echarts/renderers'
import {GraphGLChart} from 'echarts-gl/charts'
import {Edge, Node} from './analysisResults'
import {useEffect, useRef} from 'react'
import {Box} from '@mui/material'
import {PlotOptions} from './analysisMenu'

use([TooltipComponent, GraphChart, GraphGLChart, CanvasRenderer, LegendComponent])

export function Graph({
  nodes,
  edges,
  categories,
  options,
}: {
  nodes: Node[]
  edges: Edge[]
  categories: string[]
  options: PlotOptions
}) {
  const container = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const chart = container.current ? init(container.current, 'dark', {renderer: 'canvas'}) : null
    const resize = () => chart && chart.resize()
    window.addEventListener('resize', resize)
    return () => {
      chart && chart.dispose()
      window.removeEventListener('resize', resize)
    }
  }, [options.use_gl])
  useEffect(() => {
    if (container.current) {
      const chart = getInstanceByDom(container.current)
      if (chart) {
        if (edges.length) {
          chart.setOption({
            legend: {
              top: '80',
              align: 'right',
              right: 'right',
              orient: 'vertical',
              type: 'plain',
              pageButtonGap: 10,
            },
            tooltip: {
              transitionDuration: 0,
              confine: true,
            },
            animationDuration: 1500,
            animationEasingUpdate: 'quinticInOut',
            backgroundColor: '#000',
            series: [
              options.use_gl
                ? {
                    type: 'graphGL',
                    nodes,
                    edges,
                    categories: categories.map(cat => {
                      return {
                        name: cat,
                      }
                    }),
                    roam: true,
                    label: {
                      show: true,
                      position: 'top',
                    },
                    emphasis: {
                      focus: 'adjacency',
                      lineStyle: {
                        width: 10,
                      },
                    },
                    forceAtlas2: {
                      steps: 10,
                      stopThreshold: 1,
                      repulsionByDegree: true,
                      linLogMode: false,
                      gravity: 0.1,
                      scaling: 1,
                      edgeWeightInfluence: 5,
                      edgeWeight: [1, 4],
                      nodeWeight: [1, 4],
                      preventOverlap: true,
                    },
                  }
                : {
                    type: 'graph',
                    layout: options.layout,
                    nodes,
                    edges,
                    categories: categories.map(cat => {
                      return {
                        name: cat,
                      }
                    }),
                    roam: true,
                    label: {
                      show: true,
                      position: 'top',
                    },
                    emphasis: {
                      focus: 'adjacency',
                      lineStyle: {
                        width: 10,
                      },
                    },
                    autoCurveness: true,
                    draggable: true,
                    scaleLimit: [0, 100],
                  },
            ],
          })
        } else {
          chart.clear()
        }
      }
    }
  }, [nodes, edges, categories, options])
  return <Box ref={container} sx={{width: '100%', height: '100%', minHeight: '10px'}} />
}
