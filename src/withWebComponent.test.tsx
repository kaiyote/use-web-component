import { fireEvent, render } from '@testing-library/react'
import React, { ReactElement, RefObject, useRef, MouseEventHandler } from 'react'
import { withWebComponent } from '.'

const TestComponent = withWebComponent<TestComponentElement, TestComponentElementProps>('test-component')

const RefWrapper = (props: any): ReactElement => {
  const innerRef = useRef<TestComponentElement>(null)
  testRef = innerRef
  return <TestComponent {...props} ref={innerRef} />
}

let testRef: RefObject<TestComponentElement> = { current: null }

describe('withWebComponent', () => {
  beforeEach(() => { testRef = { current: null } })

  it('can pass an html tag name and get a component out thatll pass through all the important standard html props', async () => {
    const FancyInput = withWebComponent('input')

    const { findByTestId } = render(<FancyInput id='testId' className='testClass' data-testid='testTestId' />)

    const theInput = await findByTestId('testTestId')
    expect(theInput).toHaveAttribute('id', 'testId')
    expect(theInput).toHaveAttribute('class', 'testClass')
  })

  it('will correctly wire all the things on an actual web component', async () => {
    const callback = jest.fn((val: string | null) => {})
    const onButtonClicked = jest.fn((ev: CustomEvent) => {})

    const { findByTestId, findByText } = render(<TestComponent class='testClass' data-testid='testComponent' simple-attr='this had better render' {...{ callback, onButtonClicked }} />)

    await findByText('this had better render')

    const theElement = await findByTestId('testComponent')
    expect(theElement).toHaveAttribute('simple-attr', 'this had better render')
    expect(theElement).toHaveAttribute('class', 'testClass')
    expect(theElement).not.toHaveAttribute('callback')

    const theButton = await findByTestId('button')
    fireEvent.click(theButton)

    expect(callback).toHaveBeenCalledWith('this had better render')

    expect(onButtonClicked.mock.calls[0][0].type).toBe('button-clicked')
    expect(onButtonClicked.mock.calls[0][0].detail).toStrictEqual({ attributeValue: 'this had better render' })
  })

  it('will still wire a click as expected even if that runs through the hook', async () => {
    const onClick = jest.fn((e => {}) as MouseEventHandler<TestComponentElement>)

    const { findByTestId, findByText } = render(<TestComponent data-testid='testComponent' onClick={onClick} simple-attr='test for click' />)

    await findByText('test for click')

    const theElement = await findByTestId('testComponent')
    fireEvent.click(theElement)

    expect(onClick.mock.calls[0][0].type).toBe('click')
    expect(onClick.mock.calls[0][0].target).toBe(theElement)
  })

  it('will forward the ref correctly and also wire all the rest of the things', async () => {
    const onButtonClicked = jest.fn((ev: CustomEvent) => {})
    const { findByTestId } = render(<RefWrapper data-testid='testComponent' onButtonClicked={onButtonClicked} simple-attr='ref test' />)

    const theElement = await findByTestId('testComponent')
    expect(theElement).toBe(testRef.current)

    const theButton = await findByTestId('button')
    fireEvent.click(theButton)

    expect(onButtonClicked.mock.calls[0][0].type).toBe('button-clicked')
    expect(onButtonClicked.mock.calls[0][0].detail).toStrictEqual({ attributeValue: 'ref test' })
  })
})
