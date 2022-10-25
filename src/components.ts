import {
  IComponentConfigurationVersions,
  IComponentsConfiguration,
  IComponentVersionConfiguration,
  IProcessedComponentConfiguration, IProcessedConfiguration,
  IProperty, IPropertyType
} from './interfaces'
import { createDirectory, readFile, ucFirst, writeFile } from './util'
import { EOL } from 'os'
import path from 'path'

const componentsDirectory = path.resolve(__dirname, '../temp')
const componentConfigurationVersions: IComponentConfigurationVersions[] = ['v2', 'v3']

export function generateComponents (config: IComponentsConfiguration): void {
  const data = processConfiguration(config)
  // console.log(data)

  writeFile(path.resolve(componentsDirectory, 'index.ts'), generateComponentsIndexFileContent(data), true)

  Object.keys(data).forEach(fullName => {
    const component = data[fullName]
    const dirPath = path.resolve(componentsDirectory, component.name)
    createDirectory(dirPath)
    writeFile(path.resolve(dirPath, 'index.ts'), generateComponentIndexFileContent(component), true)
    writeFile(path.resolve(dirPath, `I${component.name}.ts`), generateInterfaceFileContent(component), true)

    // TODO: add custom code map
    writeFile(path.resolve(dirPath, 'getSchema.ts'), generateGetSchemaFunctionContent(component, {}), true)

    component.versions.forEach(version => {
      const suffix = version.substring(1)
      const filePath = path.resolve(dirPath, `${component.name}${suffix}.ts`)
      const existingContent = readFile(filePath)
      const customCode: Record<string, string | null> = {
        HEADER: getReplaceableContentSection('HEADER', existingContent),
        COMPONENT: getReplaceableContentSection('COMPONENT', existingContent)
      }
      const content = generateComponentContent(component, version, customCode)
      console.log(EOL + EOL + content + EOL + EOL)
      writeFile(filePath, content, true)
    })
  })
}

export function generateComponentPreTests (config: IComponentsConfiguration): void {
  // TODO: write tests that check each getSchema() to ensure that all properties have a validator definition
}

function generateComponentIndexFileContent (component: IProcessedComponentConfiguration): string {
  const name = component.name
  let result = `export * from './I${name}'` + EOL
  component.versions.forEach(version => {
    const v = version.substring(1)
    result += `export { ${name} as ${name}${v} } from './${name}${v}'` + EOL
  })
  return result
}

function generateComponentsIndexFileContent (components: IProcessedConfiguration): string {
  let result = ''
  Object.keys(components).forEach(fullName => {
    const name = components[fullName].name
    result += `export * from './${name}'` + EOL
  })
  return result
}

function generateInterfaceFileContent (component: IProcessedComponentConfiguration): string {
  let result = ''

  // imports
  result += "import { IComponentInstance } from '../IComponent'" + EOL
  Object.keys(component.joinedDependencies).forEach(type => {
    const deps: string[] = []
    component.joinedDependencies[type]
      .map(v => v.substring(1))
      .forEach(v => {
        deps.push(`I${type}${v}`, `I${type}Definition${v}`)
      })
    result += "import { " + deps.join(', ') + ` } from '../${type}/I${type}'` + EOL
  })
  result += EOL

  component.versions.forEach(v => {
    const name = component.name
    const major = v.substring(1)

    const properties = component[v]?.properties
    const allowsExtensions = component[v]?.allowsExtensions
    const additionalProperties = component[v]?.additionalProperties

    ;['definition', 'built'].forEach(set => {
      if (set === 'definition') {
        result += `export interface I${name}Definition${major} {` + EOL
      } else {
        result += `export interface I${name}${major} extends IComponentInstance {` + EOL
      }

      if (allowsExtensions) {
        result += '  [extension: `x-${string}`]: any' + EOL
      }

      if (additionalProperties !== undefined) {
        const keyPattern = component[v]?.additionalPropertiesKeyPattern
        result += `  [key: ${keyPattern}]: `
        result += generatePropertyTypes(additionalProperties, major, set === 'definition') + EOL
      }

      if (properties !== undefined) {
        const props = Object.keys(properties)

        props.forEach(key => {
          const property = properties[key]
          const conditional = property.required ? '' : '?'
          result += `  ${key}${conditional}: `
          result += generatePropertyTypes(property, major, set === 'definition') + EOL
        })
      }

      result += '}' + EOL + EOL

    })
  })

  return result
}

function generateComponentContent (component: IProcessedComponentConfiguration, version: IComponentConfigurationVersions, customCode: Record<string, string | null>): string {
  const name = component.name
  const v = version.substring(1)

  // imports
  let result = "import { IComponentSpec, IVersion } from '../IComponent'" + EOL
  result += "import { EnforcerComponent } from '../Component'" + EOL
  result += "import { ExceptionStore } from '../../Exception/ExceptionStore'" + EOL
  component[version]?.dependencies.forEach(dependency => {
    result += `import { I${dependency}${v}, I${dependency}Definition${v} } from '../${dependency}/I${dependency}'` + EOL
  })
  result += `import { I${name}${v}, I${name}Definition${v} } from './I${name}'` + EOL
  result += `import { getSchema${v} } from './schemas.ts'` + EOL + EOL

  result += generateReplaceableSection('HEADER', '', customCode) + EOL

  // class
  result += `export class ${name} extends EnforcerComponent implements I${name}${v} {` + EOL
  if (component[version]?.allowsExtensions) {
    result += '  [extension: `x-${string}`]: any' + EOL
  }

  const additionalProperties = component[version]?.additionalProperties
  if (additionalProperties !== undefined) {
    const keyPattern = component[version]?.additionalPropertiesKeyPattern
    result += `  [key: ${keyPattern}]: `
    result += generatePropertyTypes(additionalProperties, v, false) + EOL
  }

  const properties = Object.keys(component[version]?.properties ?? {})
  properties.forEach(key => {
    const property = component[version]?.properties?.[key] as IProperty
    const conditional = property.required ? '!' : '?'
    result += `  ${key}${conditional}: `
    result += generatePropertyTypes(property, v, false) + EOL
  })
  if (properties.length > 0) result += EOL

  result += `  constructor (definition: I${name}Definition${v}, version?: IVersion) {` + EOL
  result += '    super(definition, version, arguments[2])' + EOL
  result += '  }' + EOL + EOL

  result += '  static spec: IComponentSpec = {' + EOL
  if ('v2' in component) {
    if (version === 'v2') {
      result += `    '2.0': 'https://spec.openapis.org/oas/v2.0#${component.reference}-object',` + EOL
    } else {
      result += `    '2.0': true,` + EOL
    }
  } else {
    result += `    '2.0': false,` + EOL
  }
  if ('v3' in component) {
    if (version === 'v3') {
      result += `    '3.0.0': 'https://spec.openapis.org/oas/v3.0.0#${component.reference}-object',` + EOL
      result += `    '3.0.1': 'https://spec.openapis.org/oas/v3.0.1#${component.reference}-object',` + EOL
      result += `    '3.0.2': 'https://spec.openapis.org/oas/v3.0.2#${component.reference}-object',` + EOL
      result += `    '3.0.3': 'https://spec.openapis.org/oas/v3.0.3#${component.reference}-object'` + EOL
    } else {
      result += `    '3.0.0': true,` + EOL
      result += `    '3.0.1': true,` + EOL
      result += `    '3.0.2': true,` + EOL
      result += `    '3.0.3': true` + EOL
    }
  } else {
    result += `    '3.0.0': false,` + EOL
    result += `    '3.0.1': false,` + EOL
    result += `    '3.0.2': false,` + EOL
    result += `    '3.0.3': false` + EOL
  }
  result += '  }' + EOL + EOL

  result += `  static getSchema = getSchema${v}` + EOL + EOL

  result += `  static validate (definition: I${name}Definition${v}, version?: IVersion): ExceptionStore {` + EOL
  result += '    return super.validate(definition, version, arguments[2])' + EOL
  result += '  }' + EOL + EOL

  // result += '  // BEGIN CUSTOM CODE FOR THIS COMPONENT BELOW THIS LINE'
  // result += customCode
  // result += '// END CUSTOM CODE FOR THIS COMPONENT ABOVE THIS LINE' + EOL
  result += generateReplaceableSection('COMPONENT', '  ', customCode)

  result += '}' + EOL

  return result
}

function generateGetSchemaFunctionContent (component: IProcessedComponentConfiguration, customCode: Record<string, string | null>): string {
  const name = component.name
  let result = `import * from './I${name}'` + EOL + EOL

  result += generateReplaceableSection('HEADER', '  ', customCode)

  component.versions.forEach(version => {
    const v = version.substring(1)
    // TODO: this is temporary, I need to look up the actual interface names for the param and return type
    result += `export function getSchema${v} (data: IValidatorData): IComponentSchema {` + EOL
    result += '}'
  })

  return result
}

function generatePropertyTypes (property: IProperty, suffix: string, isDefinition: boolean): string {
  const types = property.types.map(type => {
    return type.isComponent
      ? isDefinition ? `I${type.type}Definition${suffix}` : `I${type.type}${suffix}`
      : type.type
  })
  if (property.isArray) {
    return types.length > 1
      ? 'Array<' + types.join(' | ') + '>'
      : types[0] + '[]'
  } else if (property.isMap) {
    return 'Record<string, ' + types.join(' | ') + '>'
  } else {
    return types.join(' | ')
  }
}

function generateReplaceableSection (key: string, indent: string, contentMap: Record<string, string | null>): string {
  const content: string | null = contentMap[key] ?? null
  let result = indent + '// <!# Custom Content Begin: ' + key + ' #!>'
  result += typeof content === 'string' ? content : EOL + indent + EOL + indent
  result += '// <!# Custom Content End: ' + key + ' #!>' + EOL
  return result
}

function getReplaceableContentSection (key: string, searchContent: string): string | null {
  const rx = new RegExp(`// <!# Custom Content Begin: ${key} #!>([\\s\\S]+?)// <!# Custom Content End: ${key} #!>`)
  const match = rx.exec(searchContent)
  return match === null ? null : match[1]
}

function processConfiguration (config: IComponentsConfiguration): IProcessedConfiguration {
  const result: IProcessedConfiguration = {}

  Object.keys(config).forEach(fullName => {
    const component = config[fullName]
    const name = ucFirst(fullName.replace(/ ([a-z])/gi, function (g) { return g[1].toUpperCase() }))
    const reference = fullName.replace(/ /g, '-').toLowerCase()

    const dependencies: Record<string, string[]> = {}
    result[fullName] = {
      joinedDependencies: dependencies,
      name,
      reference,
      versions: []
    }

    componentConfigurationVersions.forEach(v => {
      if (v in component) {
        result[fullName].versions.push(v)

        const definition = component[v] as IComponentVersionConfiguration
        const componentDependencies: string[] = []

        const additionalProperties: IProperty | null = definition.additionalProperties
          ? parsePropertyType('', definition.additionalProperties)
          : null
        additionalProperties?.types
          .filter(type => type.isComponent)
          .forEach(type => {
            const name = type.name as string
            if (dependencies[name] === undefined) dependencies[name] = []
            if (!dependencies[name].includes(v)) dependencies[name].push(v)
            componentDependencies.push(name)
          })

        const properties = Object
          .keys(definition.properties ?? {})
          .map(propertyName => parsePropertyType(propertyName, definition.properties?.[propertyName] ?? ''))
          .filter(property => property !== null) as IProperty[]

        properties
          .map(property => property?.types as IPropertyType[])
          .flat()
          .filter(type => type.isComponent)
          .forEach(type => {
            const name = type.name as string
            if (dependencies[name] === undefined) dependencies[name] = []
            if (!dependencies[name].includes(v)) dependencies[name].push(v)
            componentDependencies.push(name)
          })

        result[fullName][v] = {
          allowsExtensions: definition.allowsExtensions,
          additionalProperties: additionalProperties === null ? undefined : additionalProperties,
          additionalPropertiesKeyPattern: definition.additionalPropertiesKeyPattern
            ? definition.additionalPropertiesKeyPattern
            : 'string',
          properties: properties.reduce((prev: Record<string, IProperty>, curr) => {
            prev[curr.key] = curr
            return prev
          }, {}),
          dependencies: Array.from(new Set(componentDependencies))
        }
      }
    })
  })

  return result
}

function parsePropertyType (key: string, type: string): IProperty | null {
  if (type === '') return null

  const refAllowed = type[0] === '$'
  if (refAllowed) {
    type = type.substring(1)
  }

  let isArray = false
  let isMap = false
  let isRequired = false

  if (type.endsWith('!')) {
    isRequired = true
    type = type.substring(0, type.length - 1)
  }
  if (type.endsWith('[]')) {
    isArray = true
    type = type.substring(0, type.length - 2)
  }
  if (type.endsWith('{}')) {
    isMap = true
    type = type.substring(0, type.length - 2)
  }

  const types = type
    .split('|')
    .map(t => {
      return {
        isComponent: /^[A-Z]/.test(t),
        name: ucFirst(t.replace(/ +([a-z])/g, function (g) { return g[1].toUpperCase() })),
        type: t
      }
    })

  const result: IProperty = {
    refAllowed,
    key,
    isArray,
    isMap,
    required: isRequired,
    types
  }
  return result
}
