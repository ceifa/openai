import { Readable, Transform } from 'stream'
import FormData from 'form-data'
import fetch, { Response } from 'node-fetch'
import type {
    Answer,
    AnswerRequest,
    Classification,
    ClassificationRequest,
    Completion,
    CompletionRequest,
    Engine,
    EngineId,
    File,
    FilePurpose,
    FineTune,
    FineTuneEvent,
    FineTuneRequest,
    JsonLines,
    List,
    SearchDocument,
    SearchRequest,
} from './types'

const baseUrl = 'https://api.openai.com'
const defaultVersion = 'v1'

export class OpenAI {
    private readonly url: string
    private readonly headers: Record<string, string>

    constructor(apiKey: string, organizationId?: string, version: string = defaultVersion) {
        // https://beta.openai.com/docs/api-reference/authentication
        this.headers = {
            'authorization': `Bearer ${apiKey}`,
            'content-type': 'application/json',
        }

        if (organizationId) {
            this.headers['openai-organization'] = organizationId
        }

        this.url = `${baseUrl}/${version}`
    }

    // https://beta.openai.com/docs/api-reference/engines/list
    public getEngines(): Promise<Engine[]> {
        return this.request<List<Engine>>('/engines', 'GET').then((r) => r.data)
    }

    // https://beta.openai.com/docs/api-reference/engines/retrieve
    public getEngine(engine: EngineId): Promise<Engine> {
        return this.request<Engine>(`/engines/${engine}`, 'GET')
    }

    // https://beta.openai.com/docs/api-reference/completions/create
    public complete(engine: EngineId, options: CompletionRequest): Promise<Completion> {
        return this.request<Completion>(`/engines/${engine}/completions`, 'POST', options)
    }

    public async completionTextStream(engine: EngineId, options: CompletionRequest): Promise<Readable> {
        const request = await this.requestRaw(`/engines/${engine}/completions`, 'POST', { ...options, stream: true })

        console.warn("Stream completion is an experimental feature, please don't use in production")

        const transform = new Transform({
            transform: (chunk, _, callback) => {
                // Remove buffer header "data: "
                // [0x64, 0x61, 0x74, 0x61, 0x3a, 0x20]
                const body = chunk.slice(6).toString().trim()
                if (body && body[0] !== '[') {
                    try {
                        const completion = JSON.parse(body) as Completion
                        return callback(undefined, completion.choices[0].text)
                    } catch (e) {
                        throw new Error(`Faile to parse: "${chunk.toString()}"`)
                    }
                }

                callback()
            },
        })

        return request.body.pipe(transform)
    }

    // https://beta.openai.com/docs/api-reference/searches/create
    public search(engine: EngineId, options: SearchRequest): Promise<SearchDocument[]> {
        return this.request<List<SearchDocument>>(`/engines/${engine}/search`, 'POST', options).then((r) => r.data)
    }

    // https://beta.openai.com/docs/api-reference/classifications/create
    public classify(options: ClassificationRequest): Promise<Classification> {
        return this.request<Classification>('/classifications', 'POST', options)
    }

    // https://beta.openai.com/docs/api-reference/answers/create
    public answer(options: AnswerRequest): Promise<Answer> {
        return this.request<Answer>('/answers', 'POST', options)
    }

    // https://beta.openai.com/docs/api-reference/files/list
    public getFiles(): Promise<File[]> {
        return this.request<List<File>>('/files', 'GET').then((r) => r.data)
    }

    // https://beta.openai.com/docs/api-reference/files/upload
    public uploadFile(file: string, jsonlines: JsonLines, purpose: FilePurpose): Promise<File> {
        const data = new FormData()

        let fileJsonlines: string

        if (Array.isArray(jsonlines)) {
            if (typeof jsonlines[0] === 'object') {
                jsonlines = jsonlines.map((j) => JSON.stringify(j))
            }

            fileJsonlines = jsonlines.join('\n')
        } else {
            fileJsonlines = jsonlines
        }

        data.append('file', fileJsonlines, file)
        data.append('purpose', purpose)

        return this.request<File>('/files', 'POST', data)
    }

    // https://beta.openai.com/docs/api-reference/files/retrieve
    public getFile(fileId: string): Promise<File> {
        return this.request<File>(`/files/${fileId}`, 'GET')
    }

    // https://beta.openai.com/docs/api-reference/files/delete
    public deleteFile(fileId: string): Promise<void> {
        return this.request<void>(`/files/${fileId}`, 'DELETE')
    }

    // https://beta.openai.com/docs/api-reference/fine-tunes/create
    public finetune(options: FineTuneRequest): Promise<FineTune> {
        return this.request<FineTune>(`/fine-tunes`, 'POST', options)
    }

    // https://beta.openai.com/docs/api-reference/fine-tunes/list
    public getFinetunes(): Promise<FineTune[]> {
        return this.request<List<FineTune>>('/fine-tunes', 'GET').then((r) => r.data)
    }

    // https://beta.openai.com/docs/api-reference/fine-tunes/retrieve
    public getFinetune(finetuneId: string): Promise<FineTune> {
        return this.request<FineTune>(`/fine-tunes/${finetuneId}`, 'GET')
    }

    // https://beta.openai.com/docs/api-reference/fine-tunes/cancel
    public cancelFinetune(finetuneId: string): Promise<FineTune> {
        return this.request<FineTune>(`/fine-tunes/${finetuneId}/cancel`, 'POST')
    }

    // https://beta.openai.com/docs/api-reference/fine-tunes/events
    public getFinetuneEvents(finetuneId: string): Promise<FineTuneEvent[]> {
        return this.request<List<FineTuneEvent>>(`/fine-tunes/${finetuneId}/events`, 'GET').then((r) => r.data)
    }

    private async requestRaw(path: string, method: 'GET' | 'POST' | 'DELETE', body?: any): Promise<Response> {
        let headers = { ...this.headers }

        if (body instanceof FormData) {
            delete headers['content-type']
            headers = body.getHeaders(headers)
        } else if (!['string', 'undefined'].includes(typeof body)) {
            body = JSON.stringify(body)
        }

        const response = await fetch(this.url + path, {
            headers,
            method,
            body: body,
        })

        if (!response.ok) {
            let errorBody
            try {
                errorBody = await response.text()
            } catch {
                errorBody = 'Failed to get body as text'
            }

            throw new Error(`OpenAI did not return ok: ${response.status} ~ Error body: ${errorBody}`)
        }

        return response
    }

    private async request<TResponse>(path: string, method: 'GET' | 'POST' | 'DELETE', body?: any): Promise<TResponse> {
        const response = await this.requestRaw(path, method, body)
        return response.json()
    }
}
