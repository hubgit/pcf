import axios from 'axios'
import PQueue from 'p-queue'

const client = axios.create({
  baseURL: 'https://www.ebi.ac.uk/europepmc/webservices/rest/search',
})

client.interceptors.request.use(config => {
  config.params = {
    ...config.params,
    format: 'json',
  }

  return config
})

export const queue = new PQueue({ concurrency: 1 })

export const get = config => queue.add(() => client(config))
