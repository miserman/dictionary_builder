import {use, init, getInstanceByDom} from 'echarts/core'
import {LegendComponent, TooltipComponent, VisualMapComponent} from 'echarts/components'
import {CanvasRenderer} from 'echarts/renderers'
import {Scatter3DChart} from 'echarts-gl/charts'
import {Grid3DComponent} from 'echarts-gl/components'
import {Edge, Node} from './analysisResults'
import {useEffect, useRef} from 'react'
import {Box} from '@mui/material'
import {PlotOptions} from './analysisMenu'
import {UMAP} from 'umap-js'
import {NumberObject} from './building'

use([TooltipComponent, VisualMapComponent, Grid3DComponent, Scatter3DChart, CanvasRenderer, LegendComponent])

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
          const presentCats: {[index: string]: boolean} = {}
          const nodeIndices: NumberObject = {}
          const data: number[][] = []
          nodes.forEach((node, index) => {
            data.push([index])
            nodeIndices[node.name] = index
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
          const distances: {[index: string]: number} = {}
          const range = [Infinity, -Infinity]
          edges.forEach(({value}) => {
            if (value < range[0]) range[0] = value
            if (value > range[1]) range[1] = value
          })
          edges.forEach(edge => {
            const a = nodeIndices[edge.source]
            const b = nodeIndices[edge.target]
            distances[a + '-' + b] = (edge.value - range[0]) / (range[1] - range[0])
          })
          const m = new UMAP({
            nComponents: 3,
            learningRate: 0.1,
            localConnectivity: 5,
            minDist: 0.1,
            nEpochs: 1000,
            nNeighbors: 15,
            negativeSampleRate: 5,
            repulsionStrength: 1,
            setOpMixRatio: 1,
            spread: 1,
            transformQueueSize: 10,
            distanceFn: (a, b) => {
              const key = a[0] + '-' + b[0]
              return key in distances ? distances[key] : 0
            },
          })
          const layout = m.fit(data).map((coords, index) => {
            return {...nodes[index], nodeValue: nodes[index].value, value: coords}
          })
          chart.setOption({
            xAxis3D: {
              type: 'value',
            },
            yAxis3D: {
              type: 'value',
            },
            zAxis3D: {
              type: 'value',
            },
            grid3D: {
              show: false,
              environment: '#000',
              // postEffect: {
              //   enable: true,
              //   depthOfField: {
              //     enable: true,
              //     focalDistance: 420,
              //     focalRange: 10,
              //     fstop: 1.8,
              //     blurRatio: 10,
              //   },
              // },
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
              formatter: (item: {
                marker: string
                name: string
                value: number[]
                data: {host?: string; nodeValue: number}
              }) => {
                return (
                  item.marker +
                  (item.data.host ? '<i>(' + item.data.host + ')</i> ' : '') +
                  item.name +
                  ': <strong>' +
                  item.data.nodeValue.toFixed(2) +
                  '</strong>'
                )
              },
            },
            // animationDuration: 1500,
            // animationEasingUpdate: 'quinticInOut',
            series: [
              {
                type: 'scatter3D',
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
