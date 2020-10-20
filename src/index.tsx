import React, {
  createRef, ElementType, forwardRef, ForwardRefExoticComponent, PropsWithChildren,
  PropsWithoutRef, RefAttributes, RefObject, useLayoutEffect, useMemo
} from 'react'
import mergeRefs from 'react-merge-refs'
import {
  isComplexProp, isComponentType, isEventListener, listenerPropNameToEvent
} from './util'

export interface PropItem<T> {
  key: string,
  value: T
}

export type PropType<P> = P & { [key: string]: any }

export type Mappings<P> = { [K in keyof PropType<P>]?: string }

export function useWebComponent<T extends HTMLElement, P = {}> (
  props: PropType<P>, mapping: Mappings<P> = {}, eventsAreCamelCase: boolean = false
): [Partial<P>, RefObject<T>] {
  const ref = createRef<T>()

  const [probableEvents, probableProperties, returnProps] = useMemo(() => {
    const events: Array<PropItem<EventListenerOrEventListenerObject>> = []
    const properties: Array<PropItem<any>> = []
    const returnProps: Partial<P> = {}

    for (const key in props) {
      const value = props[key]
      if (isEventListener(key, value)) events.push({ key: mapping[key] ?? listenerPropNameToEvent(key, eventsAreCamelCase), value })
      else if (isComplexProp(value)) properties.push({ key: mapping[key] ?? key, value })
      else returnProps[key as keyof P] = value
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
      current[property.key as keyof T] = property.value
    }

    return () => {
      for (const event of probableEvents) {
        current.removeEventListener(event.key, event.value)
      }
    }
  }, [probableEvents, probableProperties, ref])

  return [returnProps, ref]
}

type HookProps<P> = PropType<P> & {
  mapping?: Mappings<P>,
  eventsAreCamelCase?: boolean
}

type ChildHookProps<P> = PropsWithChildren<HookProps<P>>

function genClassList (className?: string, classProp?: string): string {
  return [className, classProp].filter(Boolean).join(' ')
}

export function withWebComponent<T extends HTMLElement, P = {}> (Component: ElementType<any>): ForwardRefExoticComponent<PropsWithoutRef<HookProps<P>> & RefAttributes<T>> {
  const WebComponent = forwardRef<T, HookProps<P>>(({ children, mapping = {}, eventsAreCamelCase = false, ...props }: ChildHookProps<P>, ref) => {
    const { className, class: classProp, ...restProps } = props
    const [simpleProps, innerRef] = useWebComponent<T>(restProps, mapping, eventsAreCamelCase)

    return <Component {...simpleProps} class={genClassList(className, classProp)} ref={mergeRefs([innerRef, ref])}>{children}</Component>
  })

  const displayName = isComponentType(Component) ? Component.displayName : Component

  WebComponent.displayName = `WebComponent[${displayName ?? ''}]`

  return WebComponent
}
