import { fireEvent, render } from '@testing-library/react'
import React, { ReactElement, RefObject } from 'react'
import { useWebComponent } from '.'

let testRef: RefObject<TestComponentElement> = { current: null }

type HookTesterProps = TestComponentElementProps & { camelEvents?: boolean, propMappings?: { [key: string]: string }, [key: string]: any }

function WebComponentWithHook ({ camelEvents = false, propMappings, ...props }: HookTesterProps): ReactElement {
  const [simpleProps, ref] = useWebComponent<TestComponentElement, TestComponentElementProps>(props, propMappings, camelEvents)
  testRef = ref
  return <test-component {...simpleProps} ref={ref} data-testid='component'></test-component>
}

describe('useWebComponent', () => {
  beforeEach(() => { testRef = { current: null } })

  it('can pass your own attributes to the web-component without using the hook', async () => {
    const { findByText } = render(<test-component simple-attr='this is a test'></test-component>)

    await findByText('this is a test')
  })

  it('will pass through simple attributes for you to spread onto the web component', async () => {
    const { findByText } = render(<WebComponentWithHook simple-attr='this is a test through the hook' />)

    await findByText('this is a test through the hook')
  })

  it('will correctly attach the ref to the web-component', async () => {
    const { findByText, getByTestId } = render(<WebComponentWithHook simple-attr='this is a test for the ref' />)

    await findByText('this is a test for the ref')
    expect(getByTestId('component')).toBe(testRef.current)
  })

  it('will correctly pass through simple attributes to the web component', async () => {
    const { findByText, getByTestId } = render(<WebComponentWithHook simple-attr='test for passthrough' totally-not-a-thing='this isnt a real prop' />)

    await findByText('test for passthrough')
    expect(getByTestId('component')).toHaveAttribute('totally-not-a-thing', 'this isnt a real prop')
  })

  it('will set a complex prop on the element directly to avoid react stringifying it', async () => {
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    const callbackFn = jest.fn((val: string | null) => {})
    const { findByText, findByTestId } = render(<WebComponentWithHook simple-attr='test for complex' callback={callbackFn} />)

    await findByText('test for complex')
    const theElement: TestComponentElement = await findByTestId('component')
    expect(theElement.callback).toBe(callbackFn)

    const theButton = await findByTestId('button')
    fireEvent.click(theButton)

    expect(callbackFn).toHaveBeenCalledWith('test for complex')
  })

  it('will attach an event listener given a function that starts with "on"', async () => {
    const listenerFn = jest.fn((ev: CustomEvent) => {})
    const { findByText, findByTestId } = render(<WebComponentWithHook simple-attr='test for listener' onButtonClicked={listenerFn} />)

    await findByText('test for listener')

    const theButton = await findByTestId('button')
    fireEvent.click(theButton)

    expect(listenerFn.mock.calls[0][0].type).toBe('button-clicked')
    expect(listenerFn.mock.calls[0][0].detail).toStrictEqual({ attributeValue: 'test for listener' })
  })

  it('will bind correctly to an event published in camelCase instead of kebab-case', async () => {
    const listenerFn = jest.fn((ev: CustomEvent) => {})
    const { findByTestId } = render(<WebComponentWithHook simple-attr='test for camel listener' onButtonClicked={listenerFn} camelEvents />)

    const theButton = await findByTestId('button')
    fireEvent.click(theButton)

    expect(listenerFn.mock.calls[0][0].type).toBe('buttonClicked')
    expect(listenerFn.mock.calls[0][0].detail).toStrictEqual({ attributeValue: 'test for camel listener' })
  })

  it('will use custom prop/event mapping if provided', async () => {
    const onEventHappened = jest.fn((ev: CustomEvent) => {})
    const onCamelEventHappened = jest.fn((ev: CustomEvent) => {})
    const callbackFn = jest.fn((arg: string | null) => {})

    const propMappings = {
      onEventHappened: 'button-clicked',
      onCamelEventHappened: 'buttonClicked',
      callbackFn: 'callback'
    }

    const { findByTestId } = render(<WebComponentWithHook simple-attr='custom prop mapping test' {...{ propMappings, onEventHappened, onCamelEventHappened, callbackFn }} />)

    const theButton = await findByTestId('button')
    fireEvent.click(theButton)

    expect(onCamelEventHappened.mock.calls[0][0].type).toBe('buttonClicked')
    expect(onCamelEventHappened.mock.calls[0][0].detail).toStrictEqual({ attributeValue: 'custom prop mapping test' })

    expect(onEventHappened.mock.calls[0][0].type).toBe('button-clicked')
    expect(onEventHappened.mock.calls[0][0].detail).toStrictEqual({ attributeValue: 'custom prop mapping test' })

    expect(callbackFn).toHaveBeenCalledWith('custom prop mapping test')
  })
})
