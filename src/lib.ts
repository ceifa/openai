import {
    Answer,
    AnswerRequest,
    Classification,
    ClassificationRequest,
    Completion,
    CompletionRequest,
    ContentLabel,
    Embedding,
    EmbeddingRequest,
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
} from './types.js'
import { Readable, Transform } from 'stream'
import FormData from 'form-data'
import fetch, { Response } from 'node-fetch'

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

    // https://beta.openai.com/docs/guides/fine-tuning/use-a-fine-tuned-model
    public completeFromModel(fineTunedModel: string, options: CompletionRequest): Promise<Completion> {
        return this.request<Completion>(`/completions`, 'POST', { ...options, model: fineTunedModel })
    }

    public async completeAndStream(engine: EngineId, options: CompletionRequest): Promise<Readable> {
        const request = await this.requestRaw(`/engines/${engine}/completions`, 'POST', { ...options, stream: true })
        // @ts-ignore body will always be present for this request
        return request.body.pipe(this.eventStreamTransformer())
    }

    public async completeFromModelAndStream(fineTunedModel: string, options: CompletionRequest): Promise<Readable> {
        const request = await this.requestRaw(`/completions`, 'POST', {
            ...options,
            model: fineTunedModel,
            stream: true,
        })
        // @ts-ignore body will always be present for this request
        return request.body.pipe(this.eventStreamTransformer())
    }

    // https://beta.openai.com/docs/engines/content-filter
    public async contentFilter(content: string, user?: string): Promise<ContentLabel> {
        const completion = await this.complete('content-filter-alpha-c4', {
            prompt: `<|endoftext|>${content}\n--\nLabel:`,
            temperature: 0,
            max_tokens: 1,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            logprobs: 10,
            user,
        })

        let label = Number(completion.choices[0].text) as ContentLabel
        if (label === ContentLabel.Unsafe) {
            const logprobs = completion.choices[0].logprobs?.top_logprobs[0]

            if (logprobs && logprobs['2'] < -0.355) {
                if (logprobs['0'] && logprobs['1']) {
                    label = logprobs['0'] >= logprobs['1'] ? ContentLabel.Safe : ContentLabel.Sensitive
                } else if (logprobs['0']) {
                    label = ContentLabel.Safe
                } else if (logprobs['1']) {
                    label = ContentLabel.Sensitive
                }
            }
        }

        if (![0, 1, 2].includes(label)) {
            label = ContentLabel.Unsafe
        }

        return label
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

    // https://beta.openai.com/docs/api-reference/embeddings
    public createEmbedding(engine: EngineId, options: EmbeddingRequest): Promise<List<Embedding>> {
        return this.request<List<Embedding>>(`/engines/${engine}/embeddings`, 'POST', options)
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
                const {
                    error: { message },
                } = (await response.json()) as { error: { message: string } }
                errorBody = message
            } catch {
                try {
                    errorBody = await response.text()
                } catch {
                    errorBody = 'Failed to get body as text'
                }
            }

            throw new Error(`OpenAI did not return ok: ${response.status} ~ Error body: ${errorBody}`)
        }

        return response
    }

    private async request<TResponse>(path: string, method: 'GET' | 'POST' | 'DELETE', body?: any): Promise<TResponse> {
        const response = await this.requestRaw(path, method, body)
        return response.json() as Promise<TResponse>
    }

    private eventStreamTransformer(): Transform {
        // [0x64, 0x61, 0x74, 0x61, 0x3a, 0x20]
        const dataHeader = Buffer.from('data: ')

        return new Transform({
            transform: function (this: Transform & { prevChunk: Buffer | undefined }, chunk: Buffer, _, callback) {
                // If current chunk starts with "data:"
                if (
                    chunk.length >= dataHeader.length &&
                    dataHeader.compare(chunk, undefined, dataHeader.length) === 0
                ) {
                    if (this.prevChunk) {
                        // Parse previous chunk as completion and push text
                        const completion = JSON.parse(this.prevChunk.toString()) as Completion
                        this.push(completion.choices[0].text)
                        this.prevChunk = undefined
                    }

                    // Remove current header
                    chunk = chunk.slice(dataHeader.length)
                }

                // Append current chunk to previous chunk
                this.prevChunk = this.prevChunk ? Buffer.concat([this.prevChunk, chunk]) : chunk

                // Should not care about the [DONE] because it will not be handled
                callback()
            },
        })
    }
}
