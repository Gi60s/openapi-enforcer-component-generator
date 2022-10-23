import { createInterfaceFiles, generateComponents } from './components'
import { IComponentsConfiguration } from './interfaces'

const config: IComponentsConfiguration = {
  Callback: {
    v3: {
      allowsExtensions: true,
      additionalProperties: 'PathItem',
    }
  },
  Components: {
    v3: {
      allowsExtensions: true,
      properties: {
        schemas: 'Schema|Reference{}',
        responses: 'Response|Reference{}',
        parameters: 'Parameter|Reference{}',
        examples: 'Example|Reference{}',
        requestBodies: 'RequestBody|Reference{}',
        headers: 'Header|Reference{}',
        securitySchemes: 'SecurityScheme|Reference{}',
        links: 'Link|Reference{}',
        callbacks: 'Callback|Reference{}'
      }
    }
  },
  Contact: {
    v2: {
      allowsExtensions: true,
      properties: {
        name: 'string',
        url: 'string',
        email: 'string'
      }
    },
    v3: {
      allowsExtensions: true,
      properties: {
        name: 'string',
        url: 'string',
        email: 'string'
      }
    }
  },
  Discriminator: {
    v3: {
      allowsExtensions: false,
      properties: {
        propertyName: 'string!',
        mapping: 'string{}'
      }
    }
  },
  Encoding: {
    v3: {
      allowsExtensions: true,
      properties: {
        contentType: 'string',
        headers: 'Header|Reference{}',
        style: 'string',
        explode: 'boolean',
        allowReserved: 'boolean'
      }
    }
  },
  Example: {
    v2: {
      allowsExtensions: false,
      additionalProperties: 'any'
    },
    v3: {
      allowsExtensions: true,
      properties: {
        summary: 'string',
        description: 'string',
        value: 'any',
        externalValue: 'string'
      }
    }
  },
  'External Documentation': {
    v2: {
      allowsExtensions: true,
      properties: {
        description: 'string',
        url: 'string!'
      }
    },
    v3: {
      allowsExtensions: true,
      properties: {
        description: 'string',
        url: 'string!'
      }
    }
  },
  Link: {
    v3: {
      allowsExtensions: true,
      properties: {
        operationRef: 'string',
        operationId: 'string',
        parameters: 'any{}',
        requestBody: 'any',
        description: 'string',
        server: 'Server'
      }
    }
  },
  Header: {
    v2: {
      allowsExtensions: true,
      properties: {
        description: 'string',
        type: "'array'|'boolean'|'integer'|'number'|'string'!",
        format: 'string',
        items: 'Items',
        collectionFormat: "'csv'|'ssv'|'tsv'|'pipes'",
        default: 'any',
        maximum: 'number',
        exclusiveMaximum: 'number',
        minimum: 'number',
        exclusiveMinimum: 'number',
        maxLength: 'number',
        minLength: 'number',
        pattern: 'string',
        maxItems: 'number',
        minItems: 'number',
        uniqueItems: 'boolean',
        enum: 'any[]',
        multipleOf: 'number'
      }
    },
    v3: {
      allowsExtensions: true,
      properties: {
        description: 'string',
        required: 'boolean',
        deprecated: 'boolean',
        allowEmptyValue: 'boolean',
        style: "'simple'",
        explode: 'boolean',
        allowReserved: 'boolean',
        schema: 'Schema|Reference',
        example: 'any',
        examples: 'Example|Reference{}',
        content: 'MediaType{}'
      }
    }
  },
  Info: {
    v2: {
      allowsExtensions: true,
      properties: {
        title: 'string!',
        description: 'string',
        termsOfService: 'string',
        contact: 'Contact',
        license: 'License',
        version: 'string!'
      }
    },
    v3: {
      allowsExtensions: true,
      properties: {
        title: 'string!',
        description: 'string',
        termsOfService: 'string',
        contact: 'Contact',
        license: 'License',
        version: 'string!'
      }
    }
  },
  License: {
    v2: {
      allowsExtensions: true,
      properties: {
        name: 'string!',
        url: 'string'
      }
    },
    v3: {
      allowsExtensions: true,
      properties: {
        name: 'string!',
        url: 'string'
      }
    }
  },
  'Media Type': {
    v3: {
      allowsExtensions: true,
      properties: {
        schema: 'Schema|Reference',
        example: 'any',
        examples: 'Example|Reference{}',
        encoding: 'Encoding{}'
      }
    }
  },
  'OAuth Flow': {
    v3: {
      allowsExtensions: true,
      properties: {
        authorizationUrl: 'string',
        tokenUrl: 'string',
        refreshUrl: 'string',
        scopes: 'string{}'
      }
    }
  },
  'OAuth Flows': {
    v3: {
      allowsExtensions: true,
      properties: {
        implicit: 'OAuth Flow',
        password: 'OAuth Flow',
        clientCredentials: 'OAuth Flow',
        authorizationCode: 'OAuth Flow',
      }
    }
  },
  OpenAPI: {
    v3: {
      allowsExtensions: true,
      properties: {
        openapi: 'string!',
        info: 'Info!',
        servers: 'Server[]',
        paths: 'Paths!',
        components: 'Components',
        security: 'SecurityRequirement[]',
        tags: 'Tag[]',
        externalDocs: 'ExternalDocumentation'
      }
    }
  },
  Operation: {
    v2: {
      allowsExtensions: true,
      properties: {
        tags: 'string[]',
        summary: 'string',
        description: 'string',
        externalDocs: 'ExternalDocumentation',
        operationId: 'string',
        consumes: 'string[]',
        produces: 'string[]',
        parameters: '$Parameter[]',
        responses: 'Responses!',
        schemes: 'string[]',
        deprecated: 'boolean',
        security: 'SecurityRequirement[]'
      }
    },
    v3: {
      allowsExtensions: true,
      properties: {
        tags: 'string[]',
        summary: 'string',
        description: 'string',
        externalDocs: 'ExternalDocumentation',
        operationId: 'string',
        parameters: 'Parameter|Reference[]',
        requestBody: 'RequestBody|Reference',
        responses: 'Responses!',
        callbacks: 'Callback|Reference{}',
        deprecated: 'boolean',
        security: 'SecurityRequirement[]',
        servers: 'Server[]'
      }
    }
  },
  Parameter: {
    v2: {
      allowsExtensions: true,
      properties: {
        name: 'string!',
        in: "'body'|'formData'|'header'|'path'|'query'!",
        description: 'string',
        required: 'boolean',
        schema: 'Schema',
        type: "'array'|'boolean'|'file'|'integer'|'number'|'string'",
        format: 'string',
        allowEmptyValue: 'boolean',
        items: 'Items',
        collectionFormat: "'csv'|'ssv'|'tsv'|'pipes'|'multi'",
        default: 'any',
        maximum: 'number',
        exclusiveMaximum: 'boolean',
        minimum: 'number',
        exclusiveMinimum: 'number',
        maxLength: 'number',
        minLength: 'number',
        pattern: 'string',
        maxItems: 'number',
        minItems: 'number',
        uniqueItems: 'boolean',
        enum: 'any[]',
        multipleOf: 'number'
      }
    },
    v3: {
      allowsExtensions: true,
      properties: {
        name: 'string!',
        in: "'cookie'|'header'|'path'|'query'!",
        description: 'string',
        required: 'boolean',
        deprecated: 'boolean',
        allowEmptyValue: 'boolean',
        style: "'deepObject'|'form'|'label'|'matrix'|'pipeDelimited'|'simple'|'spaceDelimited'",
        explode: 'boolean',
        allowReserved: 'boolean',
        schema: 'Schema|Reference',
        example: 'any',
        examples: 'Example|Reference{}',
        content: 'MediaType{}'
      }
    }
  },
  'Path Item': {
    v2: {
      allowsExtensions: true,
      properties: {
        $ref: 'string',
        get: 'Operation',
        put: 'Operation',
        post: 'Operation',
        delete: 'Operation',
        options: 'Operation',
        head: 'Operation',
        patch: 'Operation',
        parameters: 'Parameter[]'
      }
    },
    v3: {
      allowsExtensions: true,
      properties: {
        $ref: 'string',
        summary: 'string',
        description: 'string',
        get: 'Operation',
        put: 'Operation',
        post: 'Operation',
        delete: 'Operation',
        options: 'Operation',
        head: 'Operation',
        patch: 'Operation',
        trace: 'Operation',
        servers: 'Server[]',
        parameters: 'Parameter[]'
      }
    }
  },
  Paths: {
    v2: {
      allowsExtensions: true,
      additionalProperties: 'Path',
      additionalPropertiesKeyPattern: '`/${string}`'
    },
    v3: {
      allowsExtensions: true,
      additionalProperties: 'Path',
      additionalPropertiesKeyPattern: '`/${string}`'
    }
  },
  Reference: {
    v2: {
      allowsExtensions: false,
      properties: {
        $ref: 'string!'
      }
    },
    v3: {
      allowsExtensions: false,
      properties: {
        $ref: 'string!'
      }
    }
  },
  'Request Body': {
    v3: {
      allowsExtensions: true,
      properties: {
        description: 'string',
        content: 'MediaType{}',
        required: 'boolean'
      }
    }
  },
  Response: {
    v3: {
      allowsExtensions: true,
      properties: {
        description: 'string!',
        headers: 'Header|Reference{}',
        content: 'MediaType{}',
        links: 'Link|Reference{}'
      }
    }
  },
  Responses: {
    v3: {
      allowsExtensions: true,
      additionalProperties: 'Response|Reference',
      additionalPropertiesKeyPattern: 'number',
      properties: {
        default: 'Response|Reference'
      }
    }
  },
  Schema: {
    v3: {
      allowsExtensions: true,
      properties: {
        type: 'string',
        allOf: 'Schema|Reference',
        oneOf: 'Schema|Reference',
        anyOf: 'Schema|Reference',
        not: 'Schema|Reference',
        title: 'string',
        maximum: 'number',
        exclusiveMaximum: 'number',
        minimum: 'number',
        exclusiveMinimum: 'number',
        maxLength: 'number',
        minLength: 'number',
        pattern: 'string',
        maxItems: 'number',
        minItems: 'number',
        maxProperties: 'number',
        minProperties: 'number',
        uniqueItems: 'boolean',
        enum: 'any[]',
        multipleOf: 'number',
        requires: 'string[]',
        items: 'Schema|Reference',
        properties: 'Schema|Reference{}',
        additionalProperties: 'Schema|Reference',
        description: 'string',
        format: 'string',
        default: 'any',
        nullable: 'boolean',
        discriminator: 'Discriminator',
        readOnly: 'boolean',
        writeOnly: 'boolean',
        xml: 'Xml',
        externalDocs: 'ExternalDocumentation',
        example: 'any',
        deprecated: 'boolean'
      }
    }
  },
  'Security Requirement': {
    v3: {
      allowsExtensions: false,
      additionalProperties: 'string[]'
    }
  },
  'Security Scheme': {
    v3: {
      allowsExtensions: true,
      properties: {
        type: "'apiKey'|'http'|'oauth2'|'openIdConnect'",
        description: 'string',
        name: 'string',
        in: "'query'|'header'|'cookie'",
        scheme: 'string',
        bearerFormat: 'string',
        flows: 'OAuthFlows',
        openIdConnectUrl: 'string'
      }
    }
  },
  Server: {
    v3: {
      allowsExtensions: true,
      properties: {
        url: 'string!',
        description: 'string',
        variables: 'ServerVariable{}'
      }
    }
  },
  'Server Variable': {
    v3: {
      allowsExtensions: true,
      properties: {
        enum: 'string[]',
        default: 'string!',
        description: 'string'
      }
    }
  },
  Tag: {
    v3: {
      allowsExtensions: true,
      properties: {
        name: 'string!',
        description: 'string',
        externalDocs: 'ExternalDocumentation'
      }
    }
  },
  Xml: {
    v3: {
      allowsExtensions: true,
      properties: {
        name: 'string',
        namespace: 'string',
        prefix: 'string',
        attribute: 'boolean',
        wrapped: 'boolean'
      }
    }
  }
}


generateComponents(config)

// const s = createInterfaceFile({
//   Contact: config2.Contact
// })

// const s = createInterfaceFile({
//   name: 'Foo',
//   versions: ['2.0', '3.0.1'],
//   properties: {
//     a: 'number',
//     b: 'boolean',
//     c: 'Bar'
//   },
//   dependencies: []
// })

// console.log(s)

// import inquirer from 'inquirer'
// import { EOL } from 'os'
// import path from 'path'
//
// function required (value: string): boolean | string {
//   return value.length === 0 ? 'Value is required' : true
// }
//
// function ucFirst (value: string): string {
//   return value[0].toUpperCase() + value.substring(1)
// }
//
// const versions = ['2.0', '3.0.0', '3.0.1', '3.0.2', '3.0.3'];
//
// inquirer
//   .prompt([
//     {
//       type: 'input',
//       name: 'name',
//       message: 'What is the name of the component?',
//       validate: required
//     },
//     {
//       type: 'checkbox',
//       name: 'specs',
//       message: 'Select supported versions:',
//       choices: versions.slice(0),
//     },
//     {
//       type: 'input',
//       name: 'properties',
//       message: 'Enter properties, seperated by spaces:'
//     }
//   ])
//   .then((answers) => {
//     const name = ucFirst(answers.name.replace(/ ([a-z])/g, function (g) { return g[1].toUpperCase() }))
//     const dirPath = path.resolve(__dirname, '../src/components/', name)
//
//     const majors = [];
//     answers.specs.forEach(spec => {
//       const major = parseInt(spec.split('.')[0])
//       if (!majors.includes(major)) majors.push(major)
//     })
//     majors.sort()
//
//     const properties = answers.properties.split(/ +/)
//
//     // create interface file
//     let cInterface = "import { IComponentInstance } from '../IComponent'" + EOL + EOL
//     majors.forEach(major => {
//       cInterface += `export interface I${name}${major} extends IComponentInstance {` + EOL
//       properties.forEach(property => {
//         cInterface += `  ${property}: unknown` + EOL
//       })
//       cInterface += '}' + EOL + EOL
//
//       cInterface += `export interface I${name}${major}Definition {` + EOL
//       properties.forEach(property => {
//         cInterface += `  ${property}: unknown` + EOL
//       })
//       cInterface += '}' + EOL + EOL
//     })
//     console.log('---- ' + dirPath + 'I' + name + '.ts')
//     console.log(cInterface)
//
//     // create component files
//     majors.forEach(major => {
//       let cImplementation = "import { EnforcerComponent } from '../src/components/Component'" + EOL
//       cImplementation += "import { ExceptionStore, IComponentSpec, IVersion } from '../src/components/IComponent'" + EOL
//       cImplementation += "import { ISchemaData } from '../src/components/ISchemaProcessor'" + EOL
//       cImplementation += "import { IComponentSchemaDefinition } from '../src/components/IComponentSchema'" + EOL
//       cImplementation += `import { I${name}${major}, I${name}${major}Definition } from './I${name}` + EOL
//
//       cImplementation += `const schema: IComponentSchemaDefinition<I${name}${major}Definition, I${name}${major}> = {` + EOL
//       cImplementation += "  type: 'object'," + EOL
//       cImplementation += "  allowsSchemaExtensions: true false," + EOL
//       cImplementation += "  properties: [" + EOL
//       cImplementation += "    {" + EOL
//       cImplementation += "      name: ''," + EOL
//       cImplementation += "      schema: {}" + EOL
//       cImplementation += "    }" + EOL
//       cImplementation += "  ]"
//       cImplementation += "}"
//
//       cImplementation += `export class ${name} extends EnforcerComponent implements I${name}${major} {` + EOL
//       properties.forEach(property => {
//         cImplementation += `  ${property}: unknown` + EOL
//       })
//       cImplementation += EOL
//
//       cImplementation += `  constructor (definition: I${name}${major}Definition, version?: IVersion) {` + EOL
//       cImplementation += '    super(definition, version, arguments[2])' + EOL
//       cImplementation += '  }' + EOL + EOL
//
//       cImplementation += '  static spec: IComponentSpec = {' + EOL
//       versions.forEach(version => {
//         const specs = []
//         const v = parseInt(version.split('.')[0])
//         if (v === major) {
//           specs.push(`    '${version}': 'https://spec.openapis.org/oas/v${version}'`)
//         } else if (majors.includes(v)) {
//           specs.push(`    '${version}': true`)
//         } else {
//           specs.push(`    '${version}': false`)
//         }
//         cImplementation += specs.join(',' + EOL)
//       })
//       cImplementation += '  }'
//
//       cImplementation += `  static validate (definition: I${name}${major}Definition, version?: IVersion): ExceptionStore {` + EOL
//       cImplementation += '    return super.validate(definition, version, arguments[2])' + EOL
//       cImplementation += '  }' + EOL + EOL
//
//       cImplementation += `  static getSchema (data: ISchemaData): IComponentSchemaDefinition<I${name}${major}Definition, I${name}${major}> {` + EOL
//       cImplementation += '    return schema' + EOL
//       cImplementation += '  }'
//
//       cImplementation += '}'
//
//       console.log('---- ' + dirPath + name + major + '.ts')
//       console.log(cImplementation)
//     })
//
//
//   })
//   .catch((error) => {
//     if (error.isTtyError) {
//       // Prompt couldn't be rendered in the current environment
//     } else {
//       // Something else went wrong
//     }
//   })
