export type EngineId = 'davinci' | 'curie' | 'babbage' | 'ada' | string

// The 'unknowns' it's because I don't actually know
// TODO: Discover these types
export interface Engine {
    id: EngineId
    object: string
    created?: Date
    max_replicas?: number
    owner: string
    permissions: unknown
    ready: boolean
    ready_replicas: unknown
    replicas: unknown
}

export interface DataContainer<T> {
    object: string
    data: T
}

export interface CompletionRequest {
    prompt?: string | string[]
    max_tokens?: number
    temperature?: number
    top_p?: number
    n?: number
    stream?: boolean
    logprobs?: number
    echo?: boolean
    stop?: string | string[]
    presence_penalty?: number
    frequency_penalty?: number
    best_of?: number
    logit_bias?: Record<string, unknown>
}

export interface Choice {
    text: string
    index: number
    logprobes: number | null
    finish_reason: string | null
}

export interface Completion {
    id: string
    object: string
    created: number
    model: string
    choices: Choice[]
}

export interface SearchRequest {
    query: string
    documents?: string[]
    file?: string
    max_rerank?: number
    return_metadata?: boolean
}

export interface SearchDocument {
    document: number
    object: string
    score: number
}