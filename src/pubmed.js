import axios from 'axios'
import PQueue from 'p-queue'

const API_KEY = '97ce581618e2114f51618ad95c3bbb987c08'

const client = axios.create({
  baseURL: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
})

client.interceptors.request.use(config => {
  config.params = {
    ...config.params,
    api_key: API_KEY,
  }

  return config
})

export const queue = new PQueue({ concurrency: 1 })

export const get = config => queue.add(() => client(config))

export const authors = items =>
  items
    .map(({ name }) => name) // TODO: authtype
    .filter(Boolean)
    .join(', ')

export const year = pubdate => pubdate
