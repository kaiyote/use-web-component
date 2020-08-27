import { ComponentType } from 'react'

export interface PropItem<T> {
  key: string,
  value: T
}

export type OnlyCustomProps<T> = Partial<Omit<T, keyof HTMLElement>>

export type Key<T> = keyof OnlyCustomProps<T>

export function isComponentType (x: any): x is ComponentType {
  return x.displayName !== undefined
}

export function isEventListener (key: string, x: any): x is EventListenerOrEventListenerObject {
  return key.startsWith('on') && (
    (typeof x === 'object' && x.handleEvent != null) ||
    (typeof x === 'function' && x.length === 1)
  )
}

export function listenerPropNameToEvent (key: string, isCamel: boolean = false): string {
  const eventName = key.replace('on', '')

  if (isCamel) return eventName.replace(/^./, char => char.toLowerCase())
  else {
    return eventName
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
      .toLowerCase()
  }
}

export function isComplexProp (x: any): boolean {
  return typeof x !== 'string' && typeof x !== 'boolean' && typeof x !== 'number'
}
