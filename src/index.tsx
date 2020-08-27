import React, {
  createRef, ElementType, forwardRef, ForwardRefExoticComponent, PropsWithChildren,
  PropsWithoutRef, RefAttributes, RefObject, useLayoutEffect, useMemo
} from 'react'
import mergeRefs from 'react-merge-refs'
import {
  isComplexProp, isComponentType, isEventListener, Key, listenerPropNameToEvent,
  OnlyCustomProps, PropItem
} from './util'

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
      if (isEventListener(key, value)) events.push({ key: mapping[key] ?? listenerPropNameToEvent(key, eventsAreCamelCase), value })
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

export function withWebComponent (Component: ElementType<any>): ForwardRefExoticComponent<PropsWithoutRef<any> & RefAttributes<any>> {
  const WebComponent = forwardRef(({ children, mapping = {}, eventsAreCamelCase = false, ...props }: PropsWithChildren<any>, ref) => {
    const [simpleProps, innerRef] = useWebComponent(props, mapping, eventsAreCamelCase)

    return <Component {...simpleProps} ref={mergeRefs([innerRef, ref])}>{children}</Component>
  })

  const displayName = isComponentType(Component) ? Component.displayName : Component

  WebComponent.displayName = `WebComponent[${displayName ?? ''}]`

  return WebComponent
}
