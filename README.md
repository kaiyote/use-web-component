# use-web-component
A hook to abstract the more complicated wiring of web-components inside of react

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Current Package Version](https://img.shields.io/npm/v/use-web-component.svg)](https://npmjs.org/package/use-web-component)
[![Package Downloads](https://img.shields.io/npm/dm/use-web-component.svg)](https://npmjs.org/package/use-web-component)
![CI Status](https://github.com/kaiyote/use-web-component/workflows/Pull%20Request%20Test/badge.svg)

- [Installation](#Installation)
- [Purpose](#Purpose)
- [Usage](#Usage)
  - [Higher Order Component](#higher-order-component)
  - [Hook](#hook)
- [Examples](#Examples)

# Installation
`npm install use-web-component`

# Purpose
When it comes to custom elements / web components, `React` doesn't support anything other than standard HTML event binding (`onClick`, etc) and simple (string, number, bool) attributes. If you need to attach a listener for a custom event, or a callback function as a property, you're forced to attach a ref, and touch it in a `useEffect` or `useLayoutEffect` to setup everything.

`useWebComponent` was designed to hide all of that from you, so all you have do is give it your props (not necessarily all of them) and it handles wiring custom events, setting properties, and then returns any "simple" attributes you may have passed it as the first element of its return tuple so you can spread those onto the element yourself, as well as a ref that you attach to the jsx tag so it all gets wired correctly.

Early user testing suggested that having to deal with the ref yourself was less than ideal, so the `withWebComponent` HoC was created. With it all you do is tell it the tag name of the web component, and it generates a React Component for you that already does the ref wiring inside.

# Usage
## Higher Order Component
### Type Signature
```ts
function withWebComponent (tagName: string): ForwardRefExoticComponent
```
- `tagName` is literally the string name of the web-component tag.
- the `HoC` returns a ReactComponent that will correctly forward refs so you can just use it as you would a regular react component
  - the `HoC` component also has two extra props that are the second and third arguments of the hook, so you can configure prop name mapping and whether or not the events are published as camel case

### Basic Usage
```jsx
import { withWebComponent } from 'use-web-component'

function App () {
  const MyComponent = withWebComponent('my-component')
  return (
    <MyComponent
      simple-attr='this passed through as an attribute'
      complexProp={{ value: 'this will be set as a property on the tag' }}
      onCustomEvent={e => { console.log('customEvent happened') }}
      eventsAreCamelCase
    />
  )
}

/* renders <my-component simple-attr='this passed through as an attribute'></my-component> with a listener bound to 'customEvent' and a property of 'complexProp' set to { value: 'this will be set as a property on the tag' } */
```

## Hook
### Type Signature
```ts
function useWebComponent (
  props: YourReactProps,
  mapping: {[key: string]: string} = {},
  eventsAreCamelCase: boolean = false
)
```
- `props` are the props as you would pass them to a standard `react` component
- `mapping` lets you use your own prop names in code, but map them to whatever the component expects. This only works for events and complex props.

  As an example, if a component publishes an event as `this-is-realy-lon-an-mispeld`, you could
  defined your event listener as `onLongEvent` in `props`, and then have an `{ onLongEvent: 'this-is-realy-long-an-mispeld' }` in your mapping configuration.
- `eventsAreCamelCase` -> if the component publishes events as `camelCase` instead of `kebab-case`, pass `true` here. If casing is inconsistent across events, its better to leave this as `false` and handle the `camelCase` ones via `mapping`.

### Basic Usage
```jsx
import React from 'react'
import { useWebComponent } from 'use-web-component'

function App () {
  const [simpleProps, ref] = useWebComponent({
    'simple-attr': 'this passed through as an attribute'
    complexProp: { value: 'this will be set as a property on the tag' }
    onCustomEvent: e => { console.log('customEvent happened') }
  }, {}, true)
  /* simpleProps === {
    'simple-attr': 'this passed through as an attribute'
  } */

  return <my-component {...simpleProps} ref={ref}></my-component>
}
/* renders the same result as the HoC above, with the same bindings and properties */
```

# Examples
### (for more, see [the tests](https://github.com/kaiyote/use-web-component/blob/master/src/useWebComponent.test.tsx))
### If your web component only uses simple properties, you don't need this library
```jsx
return <my-component string-attr='a string' boolean-attr number-attr={3}></my-component>
```
React will pass anything that can be stringified to `itself` across the border just fine

### Complex properties need to run through the hook
#### HoC
```jsx
const MyComponent = withWebComponent('my-component')
return <MyComponent callback-func={() => { console.log('hello') }} />
```

#### Hook
```jsx
const [, ref] = useWebComponent({
  'callback-func': () => { console.log('hello') }
})
return <my-component ref={ref}></my-component>
```
In both cases, the dom element will have a property called 'callbac-func' set to the function. If you had done this in just react, the dom element would've instead gotten an attribute with a value of '() => { console.log('hello') }' (the string version of the function) and nothing would've worked as expected.

### Any prop that starts w/ `on` is treated as a listener
```js
const onEventHappened = event => { /* do something */ }
const callback = () => { /* do something else */ }
const simple = 'just a string'
```

#### HoC
```jsx
const MyComponent = withWebComponent('my-component')
return <MyComponent {...{ simple, callback, onEventHappened }} />
```

#### Hook
```jsx
const [simpleProps, ref] = useWebComponent({
  onEventHappened, callback, simple
})
return <my-component {...simpleProps} ref={ref}></my-component>
```
Here, the dom element will fire the `onEventHappened` callback when it triggers an `event-happened` CustomEvent. It will also have a property `callback` set to the callback function, and an attribute named `simple` as well.

### Standard HTML Events can be set directly on the element
#### React will wire those correctly
```js
const onCustomEvent = event => { /* do something */ }
const onClick = event => { /* do something else */ }
```

#### HoC
```jsx
const MyComponent = withWebComponent('my-component')
return <MyComponent {...{ onCustomEvent, onClick }} />
```
Note that in the case of the HoC, the `onClick` will run through the hook, and therefor be bound the standard html way. The event argument passed to it in this case will be a MouseEvent instead of the React synthetic event. If this behavior is undesirable, it may be better to use the hook directly.

#### Hook
```jsx
const [, ref] = useWebComponent({ onCustomEvent })
return <my-component ref={ref} onClick={onClick}></my-component>
```
In both cases here, the dom element will have event listeners bound to 'click' and 'custom-event'. In the Hook example, however, the 'click' event will be a normal react SyntheticEvent instead of the basic Dom MouseEvent.

### You can modify the bound prop/event name via the `mapping` param/property
In case there's a really long, poorly spelled property that you don't want to have to keep typing over and over again.

```js
const mapping = {
  prop: 'reallyLongComplexPropName',
  onEvent: 'completely-arbitrary-event-name'
}
```

#### Hoc
```jsx
const MyComponent = withWebComponent('my-component')
return (
  <MyComponent
    prop={{ ob: 'ject' }} onEvent={() => {}}
    mapping={mapping}
  />
)
```

#### Hook
```jsx
const [, ref] = useWebComponent({
  prop: { ob: 'ject' },
  onEvent: () => {}
}, mapping)
return <my-component ref={ref}></my-component>
```
Here, the Dom element will have a property named `reallyLongComplexPropName` with the value of `{ ob: 'ject' }`, and it will run the `onEvent` function when it triggers a custom event named `completely-arbitrary-event-name`.

### You can also use `camelCase` event names instead of the more standard `kebab-case`
In case your web component publishes CustomEvents with camelCase names instead of kebab-case, you can use the last argument / `eventsAreCamelCase` property to set that configuration

#### HoC
```jsx
const MyComponent = withWebComponent('my-component')
return <MyComponent onCamelCaseEvent={() => {}} eventsAreCamelCase />
```

#### Hook
```jsx
const [, ref] = useWebComponent({
  onCamelCaseEvent: () => {}
}, {}, true)
return <my-component ref={ref}></my-component>
```
Here, the event name that will trigger the callback will be `camelCaseEvent` instead of `camel-case-event`.
