import {use, init, getInstanceByDom} from 'echarts/core'
import {TooltipComponent, LegendComponent} from 'echarts/components'
import {GraphChart} from 'echarts/charts'
import {CanvasRenderer} from 'echarts/renderers'
import {GraphGLChart} from 'echarts-gl/charts'
import {Edge, Node} from './analysisResults'
import {useContext, useEffect, useRef} from 'react'
import {Box} from '@mui/material'
import {PlotOptions} from './analysisMenu'
import {EditorTermSetter} from './termEditor'
import {InfoDrawerSetter} from './infoDrawer'

use([TooltipComponent, GraphChart, GraphGLChart, CanvasRenderer, LegendComponent])

export function Graph({nodes, edges, options}: {nodes: Node[]; edges: Edge[]; options: PlotOptions}) {
  const termEditor = useContext(EditorTermSetter)
  const updateInfoDrawerState = useContext(InfoDrawerSetter)
  const container = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const chart = container.current ? init(container.current, 'dark', {renderer: 'canvas'}) : null
    const resize = () => chart && chart.resize()
    if (chart)
      chart.on('click', params => {
        if (params.dataType === 'node' || params.componentSubType === 'graphGL') {
          termEditor(params.name, true)
          updateInfoDrawerState({type: 'add', state: {type: 'term', value: params.name}})
        }
      })
    window.addEventListener('resize', resize)
    return () => {
      if (chart) {
        const views = (chart as any)._chartsViews as {_layouting: boolean; _layoutTimeout: number}[]
        views &&
          views.forEach(view => {
            if (view._layouting) {
              view._layouting = false
              clearTimeout(view._layoutTimeout)
            }
          })
        chart.dispose()
      }
      window.removeEventListener('resize', resize)
    }
  }, [options.layout])
  useEffect(() => {
    if (container.current) {
      const chart = getInstanceByDom(container.current)
      if (chart) {
        if (options.hide_zeros) nodes = nodes.filter(node => !!node.value)
        nodes = nodes.map(node => {
          node.label = {show: node.value >= options.label_threshold}
          return node
        })
        if (edges.length) {
          const presentCats: {[index: string]: boolean} = {}
          nodes.forEach(node => {
            if ('string' === typeof node.category) {
              presentCats[node.category] = true
            } else {
              let category = ''
              node.category.forEach(cat => {
                presentCats[cat] = true
                category = cat
              })
              node.category = category
            }
            node.symbolSize = options.size_by_value ? 7 + node.prop * 18 : 10
          })
          const categories = Object.keys(presentCats).map(cat => {
            return {name: cat}
          })
          chart.setOption(
            {
              legend: {
                align: 'right',
                right: 'right',
                orient: 'vertical',
                type: 'plain',
                pageButtonGap: 10,
              },
              tooltip: {
                confine: true,
                formatter: (item: {marker: string; name: string; value: number; data: {host?: string}}) => {
                  return (
                    item.marker +
                    (item.data.host ? '<i>(' + item.data.host + ')</i> ' : '') +
                    item.name +
                    ': <strong>' +
                    item.value.toFixed(3) +
                    '</strong>'
                  )
                },
              },
              backgroundColor: '#000',
              series: [
                options.layout === 'forceAtlas2'
                  ? {
                      type: 'graphGL',
                      nodes,
                      edges,
                      categories: categories,
                      roam: true,
                      label: {
                        show: true,
                        position: 'top',
                        color: '#fff',
                      },
                      lineStyle: {
                        color: 'source',
                      },
                      emphasis: {
                        focus: 'adjacency',
                        lineStyle: {
                          color: '#fff',
                          opacity: 1,
                          width: 10,
                        },
                      },
                    }
                  : {
                      type: 'graph',
                      layout: options.layout,
                      nodes,
                      edges,
                      categories: categories,
                      roam: true,
                      label: {
                        show: true,
                        position: 'top',
                      },
                      emphasis: {
                        focus: 'adjacency',
                        itemStyle: {opacity: 1},
                        label: {opacity: 1},
                        lineStyle: {
                          width: 10,
                          opacity: 1,
                        },
                      },
                      blur: {
                        itemStyle: {opacity: 0.3},
                        lineStyle: {opacity: 0.3},
                        label: {opacity: 0.3},
                      },
                      autoCurveness: true,
                      draggable: true,
                      force: {
                        repulsion: options.repulsion,
                        gravity: options.gravity,
                        edgeLength: options.edge_length,
                      },
                      circular: {
                        rotateLabel: true,
                      },
                      lineStyle: {
                        color: 'source',
                      },
                    },
              ],
            },
            false,
            options.layout !== 'forceAtlas2'
          )
        } else {
          chart.clear()
        }
      }
    }
  }, [nodes, edges, options])
  return <Box ref={container} sx={{width: '100%', height: '100%', minHeight: '10px'}} />
}
