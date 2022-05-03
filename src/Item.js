import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import List from '@mui/material/List'
import ListItemText from '@mui/material/ListItemText'
import ListItemButton from '@mui/material/ListItemButton'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import React, { useEffect, useState } from 'react'
import he from 'he'
import * as exporter from './exporter'
import * as pubmed from './pubmed'

export const Item = React.memo(({ format, text, index, addSelectedItem }) => {
  const [citation, setCitation] = useState(text)
  const [editedCitation, setEditedCitation] = useState(text)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState()
  const [matches, setMatches] = useState()
  const [selected, setSelected] = useState()
  const [selectedItem, setSelectedItem] = useState()

  useEffect(() => {
    setCitation(text)
    setEditedCitation(text)
    setSelected(undefined)
  }, [text, addSelectedItem, index])

  useEffect(() => {
    setError(undefined)
    setMatches(undefined)
    setSelected(undefined)
    setSelectedItem(undefined)
    setSearching(true)

    pubmed
      .get({
        url: '/esearch.fcgi',
        params: {
          db: 'pubmed',
          retmode: 'json',
          retmax: 0,
          usehistory: 'y',
          term: citation,
        },
      })
      .then(async searchResponse => {
        if (!searchResponse || searchResponse.status !== 200) {
          throw new Error()
        }

        const { esearchresult } = searchResponse.data

        if (!esearchresult) {
          throw new Error()
        }

        const { count, webenv, querykey } = esearchresult

        if (Number(count) === 0) {
          setMatches([])
          return
        }

        const response = await pubmed.get({
          url: '/esummary.fcgi',
          params: {
            db: 'pubmed',
            retmode: 'json',
            retmax: 3,
            WebEnv: webenv,
            query_key: querykey,
          },
        })

        if (!response || response.status !== 200) {
          throw new Error()
        }

        const { result } = response.data

        if (!result || !result.uids) {
          throw new Error()
        }

        setMatches(result.uids.map(uid => result[uid]))
      })
      .catch(error => {
        console.error(error)
        setError('There was an error while searching for this item')
      })
      .finally(() => {
        setSearching(false)
      })
  }, [citation])

  useEffect(() => {
    if (matches && matches.length) {
      setSelected(matches[0].uid)
    } else {
      setSelected(undefined)
    }
  }, [matches])

  useEffect(() => {
    setSelectedItem(undefined)
    addSelectedItem(index, selected === null ? '' : undefined)

    if (selected) {
      exporter
        .get({
          params: {
            format: 'ris',
            id: selected,
          },
        })
        .then(response => {
          if (response && response.status === 200) {
            setSelectedItem(response.data)
            addSelectedItem(index, response.data)
          }
        })
    }
  }, [addSelectedItem, index, format, selected])

  return (
    <Paper style={{ background: '#add8e6', padding: 16 }}>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Typography variant={'h3'}>Citation {index + 1}</Typography>

          <TextField
            fullWidth
            multiline
            value={editedCitation}
            onChange={event => setEditedCitation(event.target.value)}
            style={{
              background: 'white',
              padding: 8,
              marginTop: 8,
              boxSizing: 'border-box',
            }}
          />

          {editedCitation !== citation && (
            <Button
              variant={'contained'}
              color={'primary'}
              onClick={() => setCitation(editedCitation)}
            >
              Search again
            </Button>
          )}
        </Grid>

        <Grid item xs={12}>
          {searching && <Typography variant={'body1'}>Searching…</Typography>}

          {error && <Typography variant={'body1'}>{error}</Typography>}

          {matches && (
            <Grid item xs={12}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant={'h3'}>Matches</Typography>

                  <List dense>
                    {matches.map(match => {
                      const isSelected = selected && selected === match.uid

                      return (
                        <ListItemButton
                          alignItems={'flex-start'}
                          key={match.uid}
                          style={{
                            background: isSelected ? 'yellow' : 'white',
                            borderWidth: 1,
                            borderLeftWidth: 5,
                            borderStyle: 'solid',
                            borderColor: isSelected ? 'black' : 'transparent',
                            marginBottom: 8,
                          }}
                          onClick={() =>
                            setSelected(isSelected ? null : match.uid)
                          }
                        >
                          <ListItemText
                            primary={match.title ? he.decode(match.title) : ''}
                            secondary={<Metadata item={match} />}
                            secondaryTypographyProps={{ component: 'div'} }
                          />
                        </ListItemButton>
                      )
                    })}
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant={'h3'}>Citation data</Typography>

                  {selected ? (
                    <pre
                      style={{
                        background: 'white',
                        padding: 8,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      <code>{selectedItem}</code>
                    </pre>
                  ) : (
                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                      <Typography variant={'body1'}>
                        No matches selected!
                      </Typography>

                      <Typography variant={'body1'}>
                        Either select the correct match, edit the text above and
                        search again, or leave unselected if none are correct.
                      </Typography>
                    </div>
                  )}
                </Grid>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>
    </Paper>
  )
})

const Metadata = React.memo(({ item }) => (
  <div>
    {item.authors && <div>{pubmed.authors(item.authors)}</div>}
    <div>
      {item.pubdate && <span>{pubmed.year(item.pubdate)}</span>}
      {' · '}
      {item.fulljournalname && <span>{he.decode(item.fulljournalname)}</span>}
    </div>
  </div>
))
