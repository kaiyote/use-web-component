# use-web-component
A hook to abstract the more complicated wiring of web-components inside of react

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Current Package Version](https://img.shields.io/npm/v/use-web-component.svg)](https://npmjs.org/package/use-web-component)
[![Package Downloads](https://img.shields.io/npm/dm/use-web-component.svg)](https://npmjs.org/package/use-web-component)

## Installation
`npm install use-web-component`

## Type Signature
```ts
function useWebComponent (
  props: YourReactProps,
  mapping: {[key: string]: string} = {},
  eventsAreCamelCase: boolean = false
)
```

- `props` are the props as you would pass them to a standard `react` component
- `mapping` lets you use your own prop names in code, but map them to whatever the component
expects. This only works for events and complex props.

  As an example, if a component publishes an event as `this-is-realy-lon-an-mispeld`, you could
  defined your event listener as `onLongEvent` in `props`, and then have an `{ onLongEvent: 'this-is-realy-long-an-mispeld' }` in your mapping configuration.
- `eventsAreCamelCase` -> if the component publishes events as `camelCase` instead of `kebabCase`, pass `true` here. If casing is inconsistent across events, its better to leave this
as `false` and handle the `camelCase` ones via `mapping`.

## Usage
```jsx
import React from 'react'
import { useWebComponent } from 'use-web-component'

function App () {
  const [simpleProps, ref] = useWebComponent({ all: 'the', props: () => 'for', the: 'web-component' })
  // simpleProps === { all: 'the', the: 'web-component' }

  return <my-component {...simpleProps} ref={ref}></my-component>

  // ref.current.getAttribute('all') === 'the'
  // ref.current.props === () => 'for'
  // ref.current.getAttribute('the') === 'web-component
}
```

## Equivalent vanilla react example
```jsx
import React, { useLayoutEffect, useRef } from 'react'

function App () {
  const ref = useRef(null)

  useLayoutEffect(() => {
    if (ref.current == null) return

    ref.current.props = () => 'for'
  })

  return <my-component ref={ref} all='the' the='web-component'></my-component>
}
```

## Explanation
When it comes to custom elements / web components, `React` doesn't support anything other than
standard HTML event binding (`onClick`, etc) and simple (string, number, bool) attributes. If
you need to attach a listener for a custom event, or a callback function as a property, you're
forced to attach a ref, and touch it in a `useEffect` or `useLayoutEffect` to setup everything.

This hook was designed to hide all of that from you, so all you have do is give it your props
(not necessarily all of them) and it handles wiring custom events, setting properties, and then
returns any "simple" attributes you may have passed it as the first element of its return tuple
so you can spread those onto the element yourself.

## Examples (for more, see [the tests](https://github.com/kaiyote/use-web-component/blob/master/src/useWebComponent.test.tsx))
### If your web component only uses simple properties, you don't need this hook
```jsx
return <my-component string-attr='a string' boolean-attr number-attr={3}></my-component>
```
React will pass anything that can be stringified to `itself` across the border just fine

### Complex properties need to run through the hook
```jsx
<my-component callback-func={() => {}} ref={ref}></my-component>
/* ref.current['callback-func']() ==> `ref.current['callback-func'] is not a function`
you'll end up with `callback-func="() => {}"` as an attribute, or similar, it won't
actually be a callback */

const [, ref] = useWebComponent({ 'callback-func': () => { console.log('hello') } })
return <my-component ref={ref}></my-component>
// ref.current['callback-func']() ==> 'hello'
```

### Any prop that starts w/ `on` is treated as a listener
```tsx
const onEventHappened = (event: CustomEvent) => { /* do something */ }
const callback = () => { /* do something else */ }
const simple = 'just a string'

const [simpleProps, ref] = useWebComponent(
  {onEventHappened, callback, simple }, { callback: 'event-callback' }
)
// the callback function will get attached to a property named `event-callback`
// onEventHappened will be registered for `event-happened` CustomEvents
// simpleProps => { simple: 'just a string' }
return <my-component {...simpleProps} ref={ref}></my-component>

// when `event-happened` is triggered, `onEventHappened` will be called with the entire CustomEvent object, so `type` and `detail` are both available in the function
```

### Technically you could pass standard HTML event listeners through the hook, but `react` wires
### those correctly, so it's best to pass those directly
```tsx
const onCustomEvent = (event: CustomEvent) => { /* do something */ }
const onClick = (event: SyntheticEvent) => { /* do something else */ }

const [, ref] = useWebComponent({ onCustomEvent })
return <my-component ref={ref} onClick={onClick}></my-component>
// clicking on my-component will fire the onClick handler
// `custom-event` events will trigger the onCustomEvent handler
```
