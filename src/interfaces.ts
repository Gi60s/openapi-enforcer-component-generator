export type IComponentsConfiguration = Record<string, IComponentConfiguration>

export type IComponentConfigurationVersions = 'v2' | 'v3'

export type IComponentConfiguration = Partial<Record<IComponentConfigurationVersions, IComponentVersionConfiguration>>

export interface IComponentVersionConfiguration {
  allowsExtensions: boolean
  additionalProperties?: Array<{
    type: string,
    keyPattern?: string
  }>
  properties?: Record<string, string>
  schemaIsCacheable?: boolean
}

export interface IProcessedConfiguration {
  [component: string]: IProcessedComponentConfiguration
}

export interface IProcessedComponentConfiguration {
  joinedDependencies: Record<string, string[]>
  name: string
  reference: string
  versions: IComponentConfigurationVersions[]
  v2?: IProcessedComponentVersionConfiguration
  v3?: IProcessedComponentVersionConfiguration
}

export interface IProcessedComponentVersionConfiguration {
  allowsExtensions: boolean
  additionalProperties?: Array<{
    type: IProperty,
    keyPattern: string
  }>
  properties?: Record<string, IProperty>
  dependencies: string[]
  schemaIsCacheable: boolean
}

export interface IProperty {
  refAllowed: boolean
  key: string
  isArray: boolean
  isMap: boolean
  required: boolean
  types: IPropertyType[]
  enum: string[]
}

export interface IPropertyType {
  isComponent: boolean
  type: string
  name?: string // component name if is component
  enum?: string[]
}
