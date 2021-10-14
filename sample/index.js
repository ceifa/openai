import { OpenAI } from '../dist/index.js'

const api = new OpenAI(process.env.OPENAI_API_KEY)
api.getEngines().then(console.log)
