import {ListItemIcon, ListItemText, MenuItem} from '@mui/material'
import {useContext, type KeyboardEvent} from 'react'
import {Edit} from '@mui/icons-material'
import type {FixedTerm, FuzzyTerm} from './term'
import {DataGrid, type GridColDef, type GridCellParams, GridToolbarQuickFilter, GridColumnMenu} from '@mui/x-data-grid'
import type {DictEntry} from './storage'
import {EditorTermSetter} from './termEditor'

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
  editFromEvent: (index: number, params: GridCellParams) => void
}) {
  const setEditorTerm = useContext(EditorTermSetter)
  return (
    <DataGrid
      className="bottom-search"
      rows={rows}
      columns={columns}
      showCellVerticalBorder
      disableDensitySelector
      pageSizeOptions={[100]}
      density="compact"
      slots={{
        toolbar: GridToolbarQuickFilter,
        columnMenu: props => {
          const name = props.colDef.headerName
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
      onCellKeyDown={(params: GridCellParams, e: KeyboardEvent) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          editFromEvent(0, params)
        }
      }}
      onRowClick={({row}: {row: GridRow}) => {
        setEditorTerm(row.id)
      }}
    />
  )
}
