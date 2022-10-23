import fs from 'fs'
import path from 'path'
import { IVersion } from './interfaces'


export function createDirectory (filePath: string): void {
  try {
    fs.mkdirSync(filePath)
  } catch (e: any) {
    if (e.code !== 'EEXIST') throw e
  }
}

export function ucFirst (value: string): string {
  return value[0].toUpperCase() + value.substring(1)
}

export function getVersions (): IVersion[] {
  return ['2.0', '3.0.0', '3.0.1', '3.0.2', '3.0.3']
}

export function readFile (filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8')
  } catch (e: any) {
    if (e.code === 'ENOENT') return ''
    throw e
  }
}

export function writeFile (filePath: string, content: string, overwrite: boolean): void {
  try {
    const stats = fs.statSync(filePath)
    if (stats.isFile() && overwrite) {
      fs.writeFileSync(filePath, content, 'utf8')
    }
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      fs.writeFileSync(filePath, content, 'utf8')
    }
  }
}
