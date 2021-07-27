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