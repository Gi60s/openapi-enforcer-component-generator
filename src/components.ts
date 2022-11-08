import fs from 'fs'
import {
  IComponentConfigurationVersions,
  IComponentsConfiguration,
  IComponentVersionConfiguration,
  IProcessedComponentConfiguration, IProcessedComponentVersionConfiguration, IProcessedConfiguration,
  IProperty, IPropertyType
} from './interfaces'
import { EOL } from 'os'
import path from 'path'

const componentConfigurationVersions: IComponentConfigurationVersions[] = ['v2', 'v3']

export function generateComponents (componentsDirectory: string, config: IComponentsConfiguration): void {
  const data = processConfiguration(config)

  updateFile(path.resolve(componentsDirectory, 'index.ts'), generateComponentsIndexFileContent(data))

  Object.keys(data).forEach(fullName => {
    const component = data[fullName]
    const dirPath = path.resolve(componentsDirectory, component.name)
    createDirectory(dirPath)
    updateFile(path.resolve(dirPath, 'index.ts'), generateComponentIndexFileContent(component))
    updateFile(path.resolve(dirPath, `I${component.name}.ts`), generateInterfaceFileContent(component))

    component.versions.forEach(version => {
      const suffix = version.substring(1)
      const filePath = path.resolve(dirPath, `${component.name}${suffix}.ts`)
      updateFile(filePath, generateComponentContent(component, version))
    })
  })
}

export function generateComponentPreTests (config: IComponentsConfiguration): void {
  // TODO: write tests that check each getSchema() to ensure that all properties have a validator definition
}

function createDirectory (filePath: string): void {
  try {
    fs.mkdirSync(filePath)
  } catch (e: any) {
    if (e.code !== 'EEXIST') throw e
  }
}

function determineISchemaType (property: IProperty, v: string, dependencies: Set<string>): string {
  if (property.types.length === 1) {
    const type = property.types[0]
    let t: string = 'any'

    if (type.isComponent) {
      const name = getNameCamelCase(type.type)
      const definition = `I${name}${v}Definition`
      const built = `I${name}${v}`
      dependencies.add(definition)
      dependencies.add(built)
      t = `ISchema.IComponent<${definition}, ${built}>`
    } else if (property.enum.length > 0) {
      t = 'ISchema.IString'
    } else {
      switch (type.type) {
        case 'array':
          t = 'ISchema.IArray<any>'
          break
        case 'boolean':
          t = 'ISchema.IBoolean'
          break
        case 'number':
          t ='ISchema.INumber'
          break
        case 'object':
          t ='ISchema.IObject'
          break
        case 'string':
          t ='ISchema.IString'
          break
      }
    }

    if (property.isArray) {
      return `ISchema.IArray<${t}>`
    } else if (property.isMap) {
      return `ISchema.IObject<${t}>`
    } else {
      return t
    }
  } else {
    return 'ISchema.IOneOf'
  }
}

function generateComponentIndexFileContent (component: IProcessedComponentConfiguration): string {
  const name = component.name
  let result = `export * from './I${name}'` + EOL
  component.versions.forEach(version => {
    const v = version.substring(1)
    result += `export { ${name} as ${name}${v} } from './${name}${v}'` + EOL
  })
  return generateWarning() + result
}

function generateComponentsIndexFileContent (components: IProcessedConfiguration): string {
  let result = ''
  Object.keys(components).forEach(fullName => {
    const name = components[fullName].name
    result += `export * from './${name}'` + EOL
  })
  return generateWarning() + result
}

function generateInterfaceFileContent (component: IProcessedComponentConfiguration): string {
  let result = ''

  // imports
  result += "import { IComponentInstance } from '../IComponent'" + EOL
  const dependencies = new Set<string>()
  Object.keys(component.joinedDependencies).forEach(type => {
    component.joinedDependencies[type]
      .map(v => v.substring(1))
      .forEach(v => {
        const name = getNameCamelCase(type)
        if (name !== component.name) {
          dependencies.add(`I${name}${v}`)
          dependencies.add(`I${name}${v}Definition`)
        }
      })
  })

  if (dependencies.size > 0) {
    const deps = Array.from(dependencies)
    deps.sort()
    result += 'import {' + EOL
    result += '  ' + deps.join(',' + EOL + '  ') + EOL
    result += "} from '../'" + EOL
  }

  // Object.keys(component.joinedDependencies).forEach(type => {
  //   const deps: string[] = []
  //   component.joinedDependencies[type]
  //     .map(v => v.substring(1))
  //     .forEach(v => {
  //       deps.push(`I${type}${v}`, `I${type}${v}Definition`)
  //     })
  //   result += `import { ${deps.join(', ')} } from '../${type}/I${type}'` + EOL
  // })
  result += EOL

  component.versions.forEach(v => {
    const name = component.name
    const major = v.substring(1)
    const {
        additionalProperties,
        additionalPropertiesKeyPattern: keyPattern,
        allowsExtensions,
        properties
      } = component[v] as IProcessedComponentVersionConfiguration

    ;['definition', 'built'].forEach(set => {
      if (set === 'definition') {
        result += `export interface I${name}${major}Definition {` + EOL
      } else {
        result += `export interface I${name}${major} extends IComponentInstance {` + EOL
      }

      if (allowsExtensions) {
        // eslint-disable-next-line no-template-curly-in-string
        result += '  [extension: `x-${string}`]: any' + EOL
      }

      if (additionalProperties !== undefined) {
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

      result += '}' + EOL
    })
  })

  return generateWarning() + result
}

function generateComponentContent (component: IProcessedComponentConfiguration, version: IComponentConfigurationVersions): string {
  const name = component.name
  const v = version.substring(1)
  const dependencies = new Set<string>()
  const {
    additionalProperties,
    additionalPropertiesKeyPattern: keyPattern,
    allowsExtensions,
    // dependencies,
    properties,
    schemaIsCacheable
  } = component[version] as IProcessedComponentVersionConfiguration

  // imports
  let result = "import { IComponentSpec, IVersion } from '../IComponent'" + EOL
  result += "import { EnforcerComponent } from '../Component'" + EOL
  result += "import { ExceptionStore } from '../../Exception/ExceptionStore'" + EOL
  result += `import * as ISchema from '../IComponentSchema'` + EOL
  result += "import { ISchemaProcessor } from '../ISchemaProcessor'" + EOL
  result += "<<COMPONENT_DEPENDENCIES>>"

  result += generateReplaceableSection('HEADER', '') + EOL

  if (schemaIsCacheable) {
    dependencies.add(`I${name}${v}Definition`)
    dependencies.add(`I${name}${v}`)
    result += `let cachedSchema: ISchema.IDefinition<I${name}${v}Definition, I${name}${v}> | null = null` + EOL + EOL
  }

  // class
  result += `export class ${name} extends EnforcerComponent implements I${name}${v} {` + EOL
  if (allowsExtensions) {
    // eslint-disable-next-line no-template-curly-in-string
    result += '  [extension: `x-${string}`]: any' + EOL
  }

  if (additionalProperties !== undefined) {
    result += `  [key: ${keyPattern}]: `
    result += generatePropertyTypes(additionalProperties, v, false, dependencies) + EOL
  }

  const props = Object.keys(properties ?? {})
  props.forEach(key => {
    const property = component[version]?.properties?.[key] as IProperty
    const conditional = property.required ? '!' : '?'
    result += `  ${key}${conditional}: `
    result += generatePropertyTypes(property, v, false, dependencies) + EOL
  })
  if (props.length > 0) result += EOL

  result += `  constructor (definition: I${name}${v}Definition, version?: IVersion) {` + EOL
  result += '    super(definition, version, arguments[2])' + EOL
  result += '  }' + EOL + EOL

  result += '  static spec: IComponentSpec = {' + EOL
  if ('v2' in component) {
    if (version === 'v2') {
      result += `    '2.0': 'https://spec.openapis.org/oas/v2.0#${component.reference}-object',` + EOL
    } else {
      result += "    '2.0': true," + EOL
    }
  } else {
    result += "    '2.0': false," + EOL
  }
  if ('v3' in component) {
    if (version === 'v3') {
      result += `    '3.0.0': 'https://spec.openapis.org/oas/v3.0.0#${component.reference}-object',` + EOL
      result += `    '3.0.1': 'https://spec.openapis.org/oas/v3.0.1#${component.reference}-object',` + EOL
      result += `    '3.0.2': 'https://spec.openapis.org/oas/v3.0.2#${component.reference}-object',` + EOL
      result += `    '3.0.3': 'https://spec.openapis.org/oas/v3.0.3#${component.reference}-object'` + EOL
    } else {
      result += "    '3.0.0': true," + EOL
      result += "    '3.0.1': true," + EOL
      result += "    '3.0.2': true," + EOL
      result += "    '3.0.3': true" + EOL
    }
  } else {
    result += "    '3.0.0': false," + EOL
    result += "    '3.0.1': false," + EOL
    result += "    '3.0.2': false," + EOL
    result += "    '3.0.3': false" + EOL
  }
  result += '  }' + EOL + EOL

  result += `  static getSchema (data: ISchemaProcessor): ISchema.IDefinition<I${name}${v}Definition, I${name}${v}> {` + EOL
  if (schemaIsCacheable) {
    result += '    if (cachedSchema !== null) {' + EOL
    result += '      return cachedSchema' + EOL
    result += '    }' + EOL + EOL
  }
  if (additionalProperties !== undefined) {
    if (additionalProperties.types.length > 1) {
      result += '  const additionalProperties: ISchema.IOneOf = {' + EOL
      result += "    type: 'oneOf'," + EOL
      result += '    oneOf: [' + EOL
      additionalProperties.types.forEach((type, index) => {
        result += '      {' + EOL
        result += '        condition: () => ' + (index === 0 ? 'true' : 'false') + ',' + EOL
        result += '        schema: ' + generateGetSchemaPropertySchema(type, additionalProperties, '          ', v, dependencies) + EOL
        result += '      }' + (index + 1 < additionalProperties.types.length ? ',' : '') + EOL
      })
      result += '    ],' + EOL
      result += '    error: () => {}' + EOL
      result += '  }' + EOL
    } else {
      result += `    const additionalProperties: ${determineISchemaType(additionalProperties, v, dependencies)} = ` +
        generateGetSchemaPropertySchema(additionalProperties.types[0], additionalProperties, '    ', v, dependencies) + EOL + EOL
    }
  }
  props.forEach(key => {
    const property = component[version]?.properties?.[key] as IProperty
    result += `    const ${getVarName(key)}: ISchema.IProperty<${determineISchemaType(property, v, dependencies)}> = ` +
      generateGetSchemaProperty(property, '    ', v, dependencies) + EOL + EOL
  })
  result += `    const schema: ISchema.IDefinition<I${name}${v}Definition, I${name}${v}> = {` + EOL
  result += "      type: 'object'," + EOL
  result += `      allowsSchemaExtensions: ${String(allowsExtensions)}`
  if (additionalProperties !== undefined) {
    result += ',' + EOL
    result += '      additionalProperties'
  }
  if (props.length > 0) {
    result += ',' + EOL
    result += '      properties: [' + EOL
    result += '        ' + props.map(getVarName).join(',' + EOL + '        ') + EOL
    result += '      ]'
  }
  result += EOL
  result += '    }' + EOL
  result += EOL
  result += generateReplaceableSection('SCHEMA_DEFINITION', '    ') + EOL
  if (schemaIsCacheable) {
    result += '    cachedSchema = schema' + EOL
  }
  result += '    return schema' + EOL
  result += '  }' + EOL + EOL

  result += `  static validate (definition: I${name}${v}Definition, version?: IVersion): ExceptionStore {` + EOL
  result += '    return super.validate(definition, version, arguments[2])' + EOL
  result += '  }' + EOL + EOL

  result += generateReplaceableSection('BODY', '  ')

  result += '}' + EOL + EOL

  result += generateReplaceableSection('FOOTER', '')

  if (dependencies.size > 0) {
    const items = Array.from(dependencies)
    items.sort()
    result = result.replace('<<COMPONENT_DEPENDENCIES>>',
      'import {' + EOL + '  ' + items.join(',' + EOL + '  ') + EOL + "} from '../'" + EOL)
  } else {
    result = result.replace('<<COMPONENT_DEPENDENCIES>>', '')
  }

  return generateWarning() + result
}

function generatePropertyTypes (property: IProperty, suffix: string, isDefinition: boolean, dependencies?: Set<string>): string {
  const types = property.types.map(type => {
    const dependency = type.isComponent
      ? isDefinition ? `I${getNameCamelCase(type.type)}${suffix}Definition` : `I${getNameCamelCase(type.type)}${suffix}`
      : type.type
    if (type.isComponent && dependencies !== undefined) {
      dependencies.add(dependency)
    }
    return dependency
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

function generateReplaceableSection (key: string, indent: string): string {
  return indent + '// <!# Custom Content Begin: ' + key + ' #!>' + EOL +
    indent + EOL +
    indent + '// <!# Custom Content End: ' + key + ' #!>' + EOL
}

function generateGetSchemaProperty (property: IProperty, indent: string, v: string, dependencies: Set<string>): string {
  const next = EOL + indent
  let result = '{' + next

  result += `  name: '${property.key}',` + next
  if (property.required) {
    result += '  required: true,' + next
  }

  if (property.types.length === 1) {
    result += '  schema: ' + generateGetSchemaPropertySchema(property.types[0], property, indent + '  ', v, dependencies) + next
  } else {
    result += '  schema: {' + next
    result += "    type: 'oneOf'," + next
    result += '    oneOf: [' + next
    property.types.forEach((type, index) => {
      result += '      {' + next
      result += '        condition: () => ' + (index === 0 ? 'true' : 'false') + ',' + next
      result += '        schema: ' + generateGetSchemaPropertySchema(type, property, indent + '        ', v, dependencies) + next
      result += '      }' + (index + 1 < property.types.length ? ',' : '') + next
    })
    result += '    ],' + next
    result += '    error: () => {}' + next
    result += '  }' + next
  }
  result += '}'
  return result
}

function generateGetSchemaPropertySchema (type: IPropertyType, property: IProperty, indent: string, v: string, dependencies: Set<string>): string {
  const next = EOL + indent
  const hasEnum = property.enum.length > 0
  let result = '{' + next

  const typeArray: string[] = []
  if (type.isComponent) {
    const dependency = `${getNameCamelCase(type.name!)}${v}`
    typeArray.push(
      "type: 'component'",
      `allowsRef: ${String(property.refAllowed)}`,
      `component: ${dependency}`
    )
    dependencies.add(dependency)
  } else {
    typeArray.push(`type: '${type.type}'`)
  }

  if (hasEnum) {
    result += "  type: 'string'," + next
    result += `  enum: ['${property.enum.join("', '")}']` + next

  } else if (property.isArray) {
    result += "  type: 'array',"
    result += '  items: {' + next
    result += '    ' + typeArray.join(',    ' + next) + next
    result += '  }' + next

  } else if (property.isMap) {
    result += "  type: 'object'," + next
    result += '  additionalProperties: {' + next
    result += '    ' + typeArray.join(',' + next + '    ') + next
    result += '  }' + next

  } else {
    result += '  ' + typeArray.join(',' + next + '  ') + next
  }

  result += '}'
  return result
}

function generateWarning (): string {
  return [
    '/*',
    ' * !!!!!!!!!!!!!!!!!!!!!!!!!!!!   IMPORTANT   !!!!!!!!!!!!!!!!!!!!!!!!!!!!',
    ' *',
    ' *  A portion of this file has been created from a template. You can only edit',
    ' *  content in some regions within this file. Look for a region that begins with',
    ' *  // <!# Custom Content Begin: *** #!>',
    ' *  and ends with',
    ' *  // <!# Custom Content End: *** #!>',
    ' *  where the *** is replaced by a string of some value. Within these custom',
    ' *  content regions you can edit the file without worrying about a loss of your',
    ' *  code.',
    ' */'
  ].join(EOL) + EOL + EOL
}

function getNameCamelCase (name: string): string {
  return ucFirst(name.replace(/ +([a-z])/gi, function (g) { return g[1].toUpperCase() }))
}

function getVarName (name: string): string {
  switch (name) {
    case 'default':
    case 'enum':
    case 'in':
      return '_' + name
    default:
      return name
  }
}

function processConfiguration (config: IComponentsConfiguration): IProcessedConfiguration {
  const result: IProcessedConfiguration = {}

  Object.keys(config).forEach(fullName => {
    const component = config[fullName]
    const name = getNameCamelCase(fullName)
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

        const additionalProperties: IProperty | null = definition.additionalProperties !== undefined
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
          .map(property => property.types)
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
          additionalPropertiesKeyPattern: definition.additionalPropertiesKeyPattern !== undefined
            ? definition.additionalPropertiesKeyPattern
            : 'string',
          properties: properties.reduce((prev: Record<string, IProperty>, curr) => {
            prev[curr.key] = curr
            return prev
          }, {}),
          dependencies: Array.from(new Set(componentDependencies)),
          schemaIsCacheable: definition.schemaIsCacheable === undefined ? true : definition.schemaIsCacheable
        }
      }
    })
  })

  return result
}

function parsePropertyType (key: string, type: string): IProperty | null {
  if (type === '') return null

  let isArray = false
  let isMap = false
  let isRequired = false
  let isExact = false
  let enums: string[] = []

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
  if (type.startsWith('=')) {
    isExact = true
    type = type.substring(1)
    enums = type
      .split('|')
      .map(v => v.substring(1, v.length - 1))
  }

  const types = isExact
    ? [{
      isComponent: false,
      name: '',
      type: type
    }]
    : type
      .split('|')
      .map(t => {
        return {
          isComponent: /^[A-Z]/.test(t),
          name: ucFirst(t.replace(/ +([a-z])/g, function (g) { return g[1].toUpperCase() })),
          type: t
        }
      })

  const refAllowed = types.find(t => t.isComponent && t.name === 'Reference') !== undefined

  return {
    refAllowed,
    key,
    isArray,
    isMap,
    required: isRequired,
    types: types.filter(t => !(t.isComponent && t.name === 'Reference')),
    enum: enums
  } as IProperty
}

function ucFirst (value: string): string {
  return value[0].toUpperCase() + value.substring(1)
}

function updateFile (filePath: string, content: string): void {
  let existingContent: string = ''
  try {
    existingContent = fs.readFileSync(filePath, 'utf8')
  } catch (e: any) {
    if (e.code !== 'ENOENT') throw e
  }

  // from the existing content, pull out customizable content sections
  const rx = /\/\/ <!# Custom Content Begin: (\w+?) #!>([\s\S]+?)\/\/ <!# Custom Content End: (\w+?) #!>/g
  const mappings: Record<string, string> = {}
  let match: RegExpExecArray | null = null
  while ((match = rx.exec(existingContent)) !== null) {
    if (match[1] === match[3]) {
      mappings[match[1]] = match[2]
    }
  }

  // inject custom code back into the new template
  Object.keys(mappings).forEach(key => {
    const rx = new RegExp(`(// <!# Custom Content Begin: ${key} #!>)([\\s\\S]+?)(// <!# Custom Content End: ${key} #!>)`)
    const match = rx.exec(content)
    if (match !== null) {
      content = content.replace(match[1] + match[2] + match[3], match[1] + mappings[key] + match[3])
    }
  })

  fs.writeFileSync(filePath, content, 'utf8')
}
