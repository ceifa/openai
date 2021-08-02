import fetch from 'node-fetch'
import { Completion, CompletionRequest, DataContainer, Engine, EngineId, SearchDocument, SearchRequest } from './types'

const baseUrl = 'https://api.openai.com'
const defaultVersion = 'v1'

export default class OpenAI {
    private readonly url: string
    private readonly headers: Record<string, string>

    constructor(apiKey: string, organizationId?: string, version: string = defaultVersion) {
        this.headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        }

        if (organizationId) {
            this.headers['OpenAI-Organization'] = organizationId
        }

        this.url = `${baseUrl}/${version}`
    }

    public async getEngines(): Promise<Engine[]> {
        const result = await this.request<DataContainer<Engine[]>>('/engines', 'GET')
        return result.data
    }

    public async getEngine(engine: EngineId): Promise<Engine> {
        return await this.request<Engine>('/engines/' + engine, 'GET')
    }

    public async complete(engine: EngineId, options: CompletionRequest): Promise<Completion> {
        return await this.request<Completion>(`/engines/${engine}/completions`, 'POST', options)
    }

    public async search(engine: EngineId, options: SearchRequest): Promise<DataContainer<SearchDocument[]>> {
        return await this.request<DataContainer<SearchDocument[]>>(`/engines/${engine}/search`, 'POST', options)
    }

    private async request<TResponse>(
        path: string,
        method: string,
        body?: any,
    ): Promise<TResponse> {
        const response = await fetch(this.url + path, {
            headers: this.headers,
            method,
            body: ['string', 'undefined'].includes(typeof body) ? body : JSON.stringify(body),
        })

        if (!response.ok) {
            throw new Error(`OpenAI did not return ok: ${response.status}`)
        }

        return response.json()
    }
}
