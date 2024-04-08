import {Close, Menu, RemoveCircleOutline} from '@mui/icons-material'
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import {type ChangeEvent, type KeyboardEvent, useContext, useMemo, useState} from 'react'
import {AllCategories, BuildEditContext, CategoryEditContext, ManageDictionaries, SettingsContext} from './building'
import {ImportMenu} from './import'
import {ExportMenu} from './export'
import {History} from './history'
import {Confirm} from './confirmDialog'
import {CategoryEditor} from './categoryEditor'

export function DictionaryMenu() {
  const settings = useContext(SettingsContext)
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleMenu = () => setMenuOpen(!menuOpen)
  const [editingCategory, setEditingCategory] = useState('')

  const manageDictionaries = useContext(ManageDictionaries)

  const categories = useContext(AllCategories)
  const editCategories = useContext(CategoryEditContext)
  const dictionaryAction = useContext(BuildEditContext)
  const [newCategory, setNewCategory] = useState('')
  const add = () => {
    if (newCategory && -1 === categories.indexOf(newCategory)) {
      editCategories({type: 'add', cat: newCategory})
      setNewCategory('')
    }
  }
  const cats = useMemo(
    () =>
      categories.map(cat => (
        <ListItem
          key={cat}
          disablePadding
          disableGutters
          secondaryAction={
            <IconButton
              aria-label="delete category"
              sx={{opacity: 0.5}}
              onClick={() => {
                dictionaryAction({type: 'remove_category', name: cat})
                editCategories({type: 'remove', cat: cat})
              }}
            >
              <RemoveCircleOutline />
            </IconButton>
          }
        >
          <ListItemButton dense onClick={() => setEditingCategory(cat)}>
            <ListItemText primary={cat} />
          </ListItemButton>
        </ListItem>
      )),
    [categories, dictionaryAction, editCategories]
  )
  return (
    <>
      <Stack direction="row">
        <IconButton onClick={toggleMenu} aria-label="open dictionary menu">
          <Menu />
        </IconButton>
        <Typography
          sx={{
            display: {sm: 'block', xs: 'none'},
            fontSize: {md: '1.2em', sm: '.8em'},
            maxWidth: {md: '285px', sm: '150px'},
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            alignSelf: 'center',
          }}
          noWrap
        >
          {settings.selected}
        </Typography>
      </Stack>
      <Drawer anchor="left" open={menuOpen} onClose={toggleMenu}>
        <Card
          sx={{
            height: '100%',
            width: '20em',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <CardHeader
            title={<Typography fontWeight="bold">Dictionary Menu</Typography>}
            action={
              <IconButton onClick={toggleMenu} aria-label="close dictionary menu" className="close-button">
                <Close />
              </IconButton>
            }
          />
          <Stack direction="row" sx={{mb: 2}}>
            <FormControl fullWidth>
              <InputLabel id="dictionary_select">Current</InputLabel>
              <Select
                labelId="dictionary_select"
                label="Current"
                size="small"
                value={settings.selected}
                onChange={(e: SelectChangeEvent<string>) => {
                  manageDictionaries({type: 'set', name: e.target.value})
                }}
              >
                {settings.dictionary_names.map(name => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <ImportMenu />
          </Stack>
          <CardContent sx={{alignContent: 'left', mb: 'auto', pt: 0, pb: 1, height: '100%', overflow: 'hidden'}}>
            <Stack spacing={1} sx={{height: '100%', overflowY: 'auto'}}>
              <Card elevation={5} sx={{height: '40%', minHeight: '300px', display: 'flex', flexDirection: 'column'}}>
                <CardHeader title={<Typography fontWeight="bold">Categories</Typography>} sx={{pb: 0}} />
                <CardContent sx={{p: 0, mb: 'auto', overflowY: 'auto'}}>
                  <List dense>{cats}</List>
                </CardContent>
                <CardActions>
                  <Stack direction="row">
                    <TextField
                      label="New Category Name"
                      size="small"
                      value={newCategory}
                      onKeyDown={(e: KeyboardEvent) => {
                        if (e.code === 'Enter' || e.code === 'NumpadEnter') {
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
                </CardActions>
              </Card>
              <History />
            </Stack>
          </CardContent>
          <CardActions>
            <Stack direction="column" sx={{width: '100%'}} spacing={1}>
              <ExportMenu />
              <Confirm
                label="Delete"
                message={'Delete the ' + settings.selected + ' dictionary?'}
                onConfirm={() => {
                  manageDictionaries({type: 'delete', name: settings.selected})
                }}
              />
            </Stack>
          </CardActions>
        </Card>
      </Drawer>
      <CategoryEditor category={editingCategory} onClose={() => setEditingCategory('')} />
    </>
  )
}
