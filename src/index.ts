import fetch from 'node-fetch'
import type { DataContainer, Engine } from './types'

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

    private async request<TResponse, TRequest = unknown>(
        path: string,
        method: string,
        body?: TRequest,
    ): Promise<TResponse> {
        const response = await fetch(this.url + path, {
            headers: this.headers,
            method,
            body: typeof body === 'string' ? body : JSON.stringify(body),
        })

        if (!response.ok) {
            throw new Error(`OpenAI did not return ok: ${response.status}`)
        }

        return response.json()
    }
}
