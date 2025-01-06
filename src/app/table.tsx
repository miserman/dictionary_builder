import {IconButton, ListItemIcon, ListItemText, MenuItem, Stack} from '@mui/material'
import {useContext, type KeyboardEvent, createContext, type MouseEvent, useMemo, type RefObject} from 'react'
import {Edit, FirstPage, ChevronLeft, ChevronRight, LastPage} from '@mui/icons-material'
import type {FixedTerm, FuzzyTerm} from './term'
import {
  DataGrid,
  type GridColDef,
  type GridCellParams,
  GridToolbarQuickFilter,
  GridColumnMenu,
  useGridApiRef,
  type GridColumnGroupingModel,
  type GridColumnMenuProps,
} from '@mui/x-data-grid'
import type {DictEntry} from './storage'
import {EditorTermSetter} from './termEditor'
import type {GridApiCommunity} from '@mui/x-data-grid/internals'
import {CategoryAdder} from './categoryAdder'

export const TableAPIContext = createContext<RefObject<GridApiCommunity> | null>(null)

export type GridRow = {
  [index: string]: number | string | FixedTerm | FuzzyTerm | DictEntry
  dictEntry: DictEntry
  id: string
  term: string
  sense: string
  matches: number
  ncats: number
} & (
  | {processed: FuzzyTerm}
  | {
      processed: FixedTerm
      sense: string
      frequency: string
      senses: number
      related: number
    }
)
export type GridCell = GridRow & {field: string; term_id?: string}

const tableAPI: {ref: RefObject<GridApiCommunity> | undefined} = {ref: undefined}
export function showTableTerm(term: string) {
  if (tableAPI.ref && tableAPI.ref.current) {
    const rowIndex = tableAPI.ref.current.state.sorting.sortedRows.indexOf(term)
    tableAPI.ref.current.setPage(Math.floor(rowIndex / 100))
    tableAPI.ref.current.selectRow(term, true, true)
    requestAnimationFrame(() => {
      if (tableAPI.ref && tableAPI.ref.current) {
        tableAPI.ref.current.scrollToIndexes({rowIndex})
      }
    })
  }
}

function pageActions({
  count,
  page,
  onPageChange,
}: {
  count: number
  page: number
  onPageChange: (e: MouseEvent<HTMLButtonElement>, newPage: number) => void
}) {
  const pages = Math.ceil(count / 100) - 1
  const onFirstPage = page === 0
  const onLastPage = page === pages
  return (
    <Stack direction="row">
      <IconButton aria-label="Go to first page" disabled={onFirstPage} onClick={e => onPageChange(e, 0)}>
        <FirstPage />
      </IconButton>
      <IconButton aria-label="Go to previous page" disabled={onFirstPage} onClick={e => onPageChange(e, page - 1)}>
        <ChevronLeft />
      </IconButton>
      <IconButton aria-label="Go to next page" disabled={onLastPage} onClick={e => onPageChange(e, page + 1)}>
        <ChevronRight />
      </IconButton>
      <IconButton aria-label="Go to last page" disabled={onLastPage} onClick={e => onPageChange(e, pages)}>
        <LastPage />
      </IconButton>
    </Stack>
  )
}

export function Table({
  rows,
  columns,
  isCategory,
  setEditCategory,
  editFromEvent,
}: {
  rows: GridRow[]
  columns: GridColDef[]
  isCategory: (name: string) => boolean
  setEditCategory: (name: string) => void
  editFromEvent: (index: number, row: GridCell) => void
}) {
  const setEditorTerm = useContext(EditorTermSetter)
  const api = useGridApiRef()
  tableAPI.ref = api
  const columnGroups: GridColumnGroupingModel = useMemo(() => {
    const categoryGroup: {field: string}[] = []
    columns.forEach(({field}) => {
      if (field.substring(0, 9) === 'category_') {
        categoryGroup.push({field})
      }
    })
    return [
      {
        groupId: 'term',
        headerName: 'Entry',
        description: 'Term definition.',
        headerClassName: 'column-group',
        children: [{field: 'remove'}, {field: 'term'}, {field: 'sense'}],
      },
      {
        groupId: 'descriptives',
        headerName: 'Statistics',
        description: 'Term descriptive statistics.',
        headerClassName: 'column-group',
        renderHeaderGroup: () => {
          return (
            <div>
              <span>Statistics</span>
              <CategoryAdder />
            </div>
          )
        },
        children: [{field: 'frequency'}, {field: 'matches'}, {field: 'senses'}, {field: 'related'}, {field: 'ncats'}],
      },
      {
        groupId: 'categories',
        headerName: 'Categories',
        description: 'Added dictionary categories.',
        headerClassName: 'column-group categories-column',
        children: categoryGroup,
      },
    ]
  }, [columns])
  return (
    <DataGrid
      apiRef={api}
      className="bottom-search"
      rows={rows}
      columns={columns}
      columnGroupingModel={columnGroups}
      showCellVerticalBorder
      disableDensitySelector
      pageSizeOptions={[100]}
      density="compact"
      sx={{
        '& .MuiDataGrid-columnHeader': {overflow: 'visible'},
        '& .MuiDataGrid-columnHeaderTitleContainer': {overflow: 'visible'},
        '& .column-group': {backgroundColor: '#1f1f1f', maxHeight: '2em'},
        '& .MuiDataGrid-columnHeader button': {mr: 1.3},
        '& .categories-column .MuiDataGrid-columnHeaderTitleContainerContent': {pl: 2.3},
      }}
      slots={{
        toolbar: () => <GridToolbarQuickFilter sx={{width: '200px', zIndex: 1}} />,
        columnMenu: (props: GridColumnMenuProps) => {
          const name = props.colDef.headerName || ''
          return isCategory(name) ? (
            <GridColumnMenu
              {...props}
              slots={{
                columnMenuUserItem: () => {
                  return (
                    <MenuItem
                      onClick={() => {
                        setEditCategory(name)
                      }}
                    >
                      <ListItemIcon>
                        <Edit fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Edit category</ListItemText>
                    </MenuItem>
                  )
                },
              }}
              slotProps={{
                columnMenuIserItem: {
                  displayOrder: 15,
                },
              }}
            />
          ) : (
            <GridColumnMenu {...props} />
          )
        },
      }}
      slotProps={{
        pagination: {
          ActionsComponent: pageActions,
        },
      }}
      onCellKeyDown={(params: GridCellParams, e: KeyboardEvent) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          editFromEvent(0, {...params.row, field: params.field})
        }
      }}
      onRowClick={({row}: {row: GridRow}) => {
        setEditorTerm(row.id)
      }}
    />
  )
}
