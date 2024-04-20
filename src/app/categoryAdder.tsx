import {Add, Close} from '@mui/icons-material'
import {Button, Dialog, DialogContent, DialogTitle, IconButton, Stack, TextField, Tooltip} from '@mui/material'
import {type KeyboardEvent, useContext, useState} from 'react'
import {AllCategories, CategoryEditContext} from './building'
import {CategoryEditor} from './categoryEditor'

export function CategoryAdder() {
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)
  const categories = useContext(AllCategories)
  const editCategories = useContext(CategoryEditContext)
  const [name, setName] = useState('')
  const [editingCategory, setEditingCategory] = useState('')
  const add = () => {
    if (name && -1 === categories.indexOf(name)) {
      editCategories({type: 'add', cat: name})
      setEditingCategory(name)
      setName('')
      setMenuOpen(false)
    }
  }
  return (
    <>
      <Tooltip title="add category">
        <IconButton
          size="small"
          aria-label="add category"
          sx={{position: 'absolute', right: '-42px', top: '-4px', zIndex: 1}}
          onClick={toggleMenu}
        >
          <Add />
        </IconButton>
      </Tooltip>
      {menuOpen && (
        <Dialog open={menuOpen} onClose={() => setMenuOpen(false)}>
          <DialogTitle>Add Category</DialogTitle>
          <IconButton
            aria-label="close category adder"
            onClick={toggleMenu}
            sx={{
              position: 'absolute',
              right: 8,
              top: 12,
            }}
            className="close-button"
          >
            <Close />
          </IconButton>
          <DialogContent>
            <Stack direction="row">
              <TextField
                label="New Category Name"
                size="small"
                value={name}
                onKeyDown={(e: KeyboardEvent) => {
                  if (e.code === 'Enter' || e.code === 'NumpadEnter') {
                    add()
                  }
                }}
                onChange={e => setName(e.target.value)}
              ></TextField>
              <Button variant="contained" onClick={add}>
                Add
              </Button>
            </Stack>
          </DialogContent>
        </Dialog>
      )}
      {editingCategory && <CategoryEditor category={editingCategory} onClose={() => setEditingCategory('')} />}
    </>
  )
}
