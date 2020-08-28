import 'react'

declare global {
  type DetailProps<T> = Omit<React.DetailedHTMLProps<React.HTMLAttributes<T>, T>, 'className'>

  type CustomElementProps<T extends HTMLElement, P> = DetailProps<T> & P

  interface TestComponentElementProps {
    'simple-attr'?: string,
    callback?: (arg: string | null) => void,
    class?: string | null
  }

  interface TestComponentElement extends HTMLElement, TestComponentElementProps { }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'test-component': CustomElementProps<TestComponentElement, TestComponentElementProps>
    }
  }
}

export default class TestWebComponent extends HTMLElement {
  static get observedAttributes (): string[] { return ['simple-attr'] }

  callback?: (arg: string | null) => void

  connectedCallback (): void {
    this.buildContent()
  }

  attributeChangedCallback (name: string, oldValue: any, newValue: any): void {
    if (oldValue !== newValue) this.buildContent()
  }

  private buildContent (): void {
    const textContent = this.getAttribute('simple-attr')
    this.innerHTML = `<div>
      <span>${textContent ?? ''}</span>
      <button data-testid='button' id='button'>Fire Event</button>
    </div>`

    this.querySelector<HTMLElement>('#button')!.onclick = evt => {
      this.callback?.(textContent)
      this.dispatchEvent(new CustomEvent('button-clicked', {
        detail: { attributeValue: textContent }
      }))
      this.dispatchEvent(new CustomEvent('buttonClicked', {
        detail: { attributeValue: textContent }
      }))
    }
  }
}
