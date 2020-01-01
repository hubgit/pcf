import Button from '@material-ui/core/Button'
import Grid from '@material-ui/core/Grid'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import Paper from '@material-ui/core/Paper'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import React, { useEffect, useState } from 'react'
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
        params: {
          query: `src:med ${citation}`,
        },
      })
      .then(async response => {
        if (!response || response.status !== 200) {
          throw new Error()
        }

        const { hitCount, resultList } = response.data

        if (hitCount === 0) {
          setMatches([])
          return
        }

        if (!resultList) {
          throw new Error()
        }

        setMatches(resultList.result)
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
      setSelected(matches[0].pmid)
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
                      const isSelected = selected && selected === match.pmid

                      return (
                        <ListItem
                          alignItems={'flex-start'}
                          button
                          key={match.pmid}
                          style={{
                            background: isSelected ? 'yellow' : 'white',
                            borderWidth: 1,
                            borderLeftWidth: 5,
                            borderStyle: 'solid',
                            borderColor: isSelected ? 'black' : 'transparent',
                            marginBottom: 8,
                          }}
                          onClick={() =>
                            setSelected(isSelected ? null : match.pmid)
                          }
                        >
                          <ListItemText
                            primary={match.title ? match.title : ''}
                            secondary={<Metadata item={match} />}
                          />
                        </ListItem>
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
    {item.authorString && <div>{item.authorString}</div>}
    <div>
      {item.pubYear && <span>{item.pubYear}</span>}
      {' · '}
      {item.journalTitle && <span>{item.journalTitle}</span>}
    </div>
  </div>
))
