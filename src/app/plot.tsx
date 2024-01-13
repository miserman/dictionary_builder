import {use, init, getInstanceByDom} from 'echarts/core'
import {LegendComponent, TooltipComponent, VisualMapComponent} from 'echarts/components'
import {CanvasRenderer} from 'echarts/renderers'
import {Bar3DChart} from 'echarts-gl/charts'
import {Grid3DComponent} from 'echarts-gl/components'
import {Edge, Node} from './analysisResults'
import {useEffect, useRef} from 'react'
import {Box} from '@mui/material'
import {PlotOptions} from './analysisMenu'
import {NumberObject} from './building'

use([TooltipComponent, VisualMapComponent, Grid3DComponent, Bar3DChart, CanvasRenderer, LegendComponent])

export function Plot({nodes, edges, options}: {nodes: Node[]; edges: Edge[]; options: PlotOptions}) {
  const container = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const chart = container.current ? init(container.current, 'dark') : null
    const resize = () => chart && chart.resize()
    window.addEventListener('resize', resize)
    return () => {
      chart && chart.dispose()
      window.removeEventListener('resize', resize)
    }
  }, [])
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
          const nodeIndices: NumberObject = {}
          nodes.forEach((node, index) => {
            nodeIndices[node.name] = index
            node.symbolSize = options.size_by_value ? 7 + node.prop * 18 : 10
          })
          const range = [Infinity, -Infinity]
          const layout = edges.map(edge => {
            const a = nodeIndices[edge.source]
            const b = nodeIndices[edge.target]
            if (range[0] > edge.value) range[0] = edge.value
            if (range[1] < edge.value) range[1] = edge.value
            return {
              name: nodes[a].name + ' -> ' + nodes[b].name,
              category: nodes[a].category,
              value: [nodes[a].name, nodes[b].name, edge.value],
            }
          })
          chart.setOption({
            visualMap: {
              show: false,
              min: range[0],
              max: range[1],
              inRange: {
                color: [
                  '#313695',
                  '#4575b4',
                  '#74add1',
                  '#abd9e9',
                  '#e0f3f8',
                  '#ffffbf',
                  '#fee090',
                  '#fdae61',
                  '#f46d43',
                  '#d73027',
                  '#a50026',
                ],
              },
            },
            xAxis3D: {
              type: 'category',
              axisLabel: {
                textStyle: {
                  color: '#fff',
                },
              },
            },
            yAxis3D: {
              type: 'category',
              axisLabel: {
                textStyle: {
                  color: '#fff',
                },
              },
            },
            zAxis3D: {
              type: 'value',
              axisLabel: {
                textStyle: {
                  color: '#fff',
                },
              },
            },
            grid3D: {
              environment: '#000',
              viewControl: {
                rotateSensitivity: 20,
              },
            },
            legend: {
              top: '80',
              align: 'right',
              right: 'right',
              orient: 'vertical',
              type: 'plain',
              pageButtonGap: 10,
            },
            tooltip: {
              confine: true,
              formatter: (item: {marker: string; name: string; value: [string, string, number]}) => {
                return item.marker + item.name + ': <strong>' + item.value[2] + '</strong>'
              },
            },
            series: [
              {
                type: 'bar3D',
                data: layout,
                label: {
                  color: '#fff',
                  formatter: ({name}: {name: string}) => name,
                },
              },
            ],
          })
        } else {
          chart.clear()
        }
      }
    }
  }, [nodes, edges, options])
  return <Box ref={container} sx={{width: '100%', height: '100%', minHeight: '10px'}} />
}
