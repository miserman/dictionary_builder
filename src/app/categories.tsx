import {Add, Close, Delete} from '@mui/icons-material'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
} from '@mui/material'
import {AllCategoies, CategoryEditContext, CategoryMenuOpen, CategoryMenuToggler} from './building'
import {ChangeEvent, KeyboardEvent, useContext, useState} from 'react'

export function CategoriesMenu() {
  const categoryMenuOpen = useContext(CategoryMenuOpen)
  const setCategoryMenuOpen = useContext(CategoryMenuToggler)
  const categories = useContext(AllCategoies)
  const editCategories = useContext(CategoryEditContext)
  const [newCategory, setNewCategory] = useState('')
  const close = () => setCategoryMenuOpen(false)
  const add = () => {
    editCategories({type: 'add', cat: newCategory})
    setNewCategory('')
  }
  return (
    <Dialog open={categoryMenuOpen} onClose={close}>
      <DialogTitle>Categories</DialogTitle>
      <IconButton
        aria-label="close"
        onClick={close}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: theme => theme.palette.grey[500],
        }}
      >
        <Close />
      </IconButton>
      <DialogContent>
        <List>
          {categories.map(cat => (
            <ListItem key={cat}>
              <ListItemText primary={cat} />
              <IconButton
                onClick={() => {
                  editCategories({type: 'remove', cat: cat})
                }}
              >
                <Delete />
              </IconButton>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Stack direction="row">
          <TextField
            value={newCategory}
            onKeyDown={(e: KeyboardEvent) => {
              if (e.code === 'Enter') {
                add()
              }
            }}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setNewCategory(e.target.value)
            }}
          ></TextField>
          <Button variant="contained" onClick={add}>
            Add
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  )
}
