import { createRef, RefObject, useLayoutEffect, useMemo } from 'react'

interface PropItem<T> {
  key: string,
  value: T
}

type OnlyCustomProps<T> = Partial<Omit<T, keyof HTMLElement>>

type Key<T> = keyof OnlyCustomProps<T>

function isEventThingy (key: string, x: any): x is EventListenerOrEventListenerObject {
  return key.startsWith('on') && (
    (typeof x === 'object' && x.handleEvent != null) ||
    (typeof x === 'function' && x.length === 1)
  )
}

function listenerPropNameToEvent (key: string, isCamel: boolean = false): string {
  const eventName = key.replace('on', '')

  if (isCamel) return eventName.replace(/^./, char => char.toLowerCase())
  else {
    return eventName
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
      .toLowerCase()
  }
}

function isComplexProp (x: any): boolean {
  return typeof x !== 'string' && typeof x !== 'boolean' && typeof x !== 'number'
}

export function useWebComponent<T extends HTMLElement> (
  props: OnlyCustomProps<T>, mapping: {[key: string]: string} = {}, eventsAreCamelCase: boolean = false
): [OnlyCustomProps<T>, RefObject<T>] {
  const ref = createRef<T>()

  const [probableEvents, probableProperties, returnProps] = useMemo(() => {
    const events: Array<PropItem<EventListenerOrEventListenerObject>> = []
    const properties: Array<PropItem<any>> = []
    const returnProps: OnlyCustomProps<T> = {}

    for (const key in props) {
      const typedKey = key as Key<T>
      const value = props[typedKey]
      if (isEventThingy(key, value)) events.push({ key: mapping[key] ?? listenerPropNameToEvent(key, eventsAreCamelCase), value })
      else if (isComplexProp(value)) properties.push({ key: mapping[key] ?? key, value })
      else returnProps[typedKey] = value
    }

    return [events, properties, returnProps]
  }, [props, mapping])

  useLayoutEffect(() => {
    if (ref?.current == null) return
    const { current } = ref

    for (const event of probableEvents) {
      current.addEventListener(event.key, event.value)
    }

    for (const property of probableProperties) {
      current[property.key as Key<T>] = property.value
    }

    return () => {
      for (const event of probableEvents) {
        current.removeEventListener(event.key, event.value)
      }
    }
  }, [probableEvents, probableProperties, ref])

  return [returnProps, ref]
}
