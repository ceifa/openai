import fetch from 'node-fetch'
import type {
    Answer,
    AnswerRequest,
    Classification,
    ClassificationRequest,
    Completion,
    CompletionRequest,
    DataContainer,
    Engine,
    EngineId,
    File,
    SearchDocument,
    SearchRequest
} from './types'

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
        return this.request<DataContainer<Engine[]>>('/engines', 'GET')
            .then(r => r.data)
    }

    public async getEngine(engine: EngineId): Promise<Engine> {
        return this.request<Engine>(`/engines/${engine}`, 'GET')
    }

    public async complete(engine: EngineId, options: CompletionRequest): Promise<Completion> {
        return this.request<Completion>(`/engines/${engine}/completions`, 'POST', options)
    }

    public async search(engine: EngineId, options: SearchRequest): Promise<SearchDocument[]> {
        return this.request<DataContainer<SearchDocument[]>>(`/engines/${engine}/search`, 'POST', options)
            .then(r => r.data)
    }

    public async classify(options: ClassificationRequest): Promise<Classification> {
        return this.request<Classification>('/classifications', 'POST', options)
    }

    public async answer(options: AnswerRequest): Promise<Answer> {
        return this.request<Answer>('/answers', 'POST', options)
    }

    public async getFiles() : Promise<File[]> {
        return this.request<DataContainer<File[]>>('/files', 'GET')
            .then(r => r.data)
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