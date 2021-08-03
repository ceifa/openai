export type EngineId = 'davinci' | 'curie' | 'babbage' | 'ada' | string

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

export interface ClassificationRequest {
    model: string
    query: string
    examples?: string[]
    file?: string
    labels?: string[] | null
    search_model?: string
    temperature?: number
    logprobs?: number
    max_examples?: number
    logit_bias?: Record<string, unknown>
    return_prompt?: boolean
    return_metadata?: boolean
    expand?: string[]
}

export interface ClassificationExample {
    document: number
    label: string
    text: string
}

export interface Classification {
    completion: string
    label: string
    model: string
    object: string
    search_model: string
    selected_examples: ClassificationExample[]
}

export interface AnswerRequest {
    model: string
    question: string
    examples: Array<[string, string]>
    examples_context: string
    documents?: string[]
    file?: string
    search_model?: string
    max_rerank?: number
    temperature?: number
    logprobs?: number
    max_tokens?: number
    stop?: string | string[]
    n?: number
    logit_bias?: Record<string, unknown>
    return_metadata?: boolean
    return_prompt?: boolean
    expand?: string[]
}

export interface AnswerDocument {
    document: number
    text: string
}

export interface Answer {
    answers: string[]
    completion: string | Completion
    model: string
    object: string
    search_model: string
    prompt: string
    selected_documents: AnswerDocument[]
}

export interface File {
    id: string
    object: string
    bytes: number
    created_at: number
    filename: string
    purpose: string
}