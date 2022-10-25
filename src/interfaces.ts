export type IComponentsConfiguration = Record<string, IComponentConfiguration>

export type IComponentConfigurationVersions = 'v2' | 'v3'

export type IComponentConfiguration = Partial<Record<IComponentConfigurationVersions, IComponentVersionConfiguration>>

export interface IComponentVersionConfiguration {
  allowsExtensions: boolean
  additionalProperties?: string
  additionalPropertiesKeyPattern?: string
  properties?: Record<string, string>
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

interface IProcessedComponentVersionConfiguration {
  allowsExtensions: boolean
  additionalProperties?: IProperty
  additionalPropertiesKeyPattern: string
  properties?: Record<string, IProperty>
  dependencies: string[]
}

export interface IProperty {
  refAllowed: boolean
  key: string
  isArray: boolean
  isMap: boolean
  required: boolean
  types: IPropertyType[]
}

export interface IPropertyType {
  isComponent: boolean
  type: string
  name?: string // component name if is component
}

export type IVersion = '2.0' | '3.0.0' | '3.0.1' | '3.0.2' | '3.0.3'
