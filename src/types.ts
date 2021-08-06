export type EngineId = 'davinci' | 'curie' | 'babbage' | 'ada' | string

export interface Engine {
    id: EngineId
    object: 'engine'
    created?: Date
    max_replicas?: number
    owner: string
    permissions: unknown
    ready: boolean
    ready_replicas: unknown
    replicas: unknown
}

export interface List<T> {
    object: 'list'
    data: T[]
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
    object: 'text_completion'
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
    object: 'search_result'
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
    object: 'classification'
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
    object: 'answer'
    search_model: string
    prompt: string
    selected_documents: AnswerDocument[]
}

export type FilePurpose = 'search' | 'answers' | 'classifications' | 'fine-tune'

// TODO: Improve jsonlines typing
export type JsonLines = string | string[] | unknown[]

export interface File {
    id: string
    object: string
    bytes: number
    created_at: number
    filename: string
    purpose: FilePurpose
}

export interface Hyperparams {
    n_epochs?: number
    batch_size?: number
    learning_rate_multiplier?: number
    use_packing?: boolean
    prompt_loss_weight?: number
}

export interface FineTuneRequest extends Hyperparams {
    training_file: string
    validation_file?: string
    model?: string
    compute_classification_metrics?: boolean
    classification_n_classes?: number
    classification_positive_class?: string
    classification_betas?: number[]
}

export interface FineTuneEvent {
    object: 'fine-tune-event',
    created_at: number
    // TODO: Improve level typing
    level: string
    message: string
}

export interface FineTune {
    id: string,
    object: 'fine-tune',
    model: string,
    created_at: number,
    events: FineTuneEvent[],
    fine_tuned_model: string,
    hyperparams: Hyperparams,
    organization_id: string,
    result_files: File[],
    // TODO: Improve status typing
    status: string,
    validation_files: File[],
    training_files: File[],
    updated_at: number,
    user_id: string
  }