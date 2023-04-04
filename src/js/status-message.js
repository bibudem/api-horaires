import { LitElement, html, unsafeCSS } from 'lit'
import statusCSS from '../scss/status-message.scss?inline'
console.log(statusCSS)
class StatusMessage extends LitElement {
  static get properties() {
    return {
      type: {
        // 'success' | 'error'
        reflect: true,
      },
    }
  }

  static styles = unsafeCSS(`
    ${statusCSS}
  `)

  constructor() {
    super()

    this.updateComplete.then(() => {
      if (this.type) {
        this.renderRoot.querySelector('.status').classList.add(`note-${this.type}`)
      }
    })
  }

  // attributeChangedCallback(name, oldValue, newValue) {
  //   console.log(`${name} attribute value changed from ${oldValue} to ${newValue}`)
  //   const status = this.renderRoot.querySelector('.status')
  //   if (oldValue) {
  //     status.classList.remove(`note-${oldValue}`)
  //   }
  //   status.classList.add(`note-${newValue}`)
  // }

  async close() {
    await this.toggle('collapsed')
  }

  toggle(collapseClass) {
    return new Promise(resolve => {
      // debugger;
      this.style.height = ''
      this.style.transition = 'none'

      function onTransitionend() {
        this.style.height = ''
        this.removeEventListener('transitionend', onTransitionend)
        setTimeout(() => {
          this.parentElement.removeChild(this)
          resolve()
        })
      }

      const startHeight = window.getComputedStyle(this).height

      // Remove the collapse class, and force a layout calculation to get the final height
      this.classList.toggle(collapseClass)
      const height = window.getComputedStyle(this).height

      // Set the start height to begin the transition
      this.style.height = startHeight

      // wait until the next frame so that everything has time to update before starting the transition
      requestAnimationFrame(() => {
        this.style.transition = ''

        requestAnimationFrame(() => {
          this.style.height = height
        })
      })

      // Clear the saved height values after the transition
      this.addEventListener('transitionend', onTransitionend)
    })
  }

  render() {
    return html`<div class="status-container">
      <div class="status note"><button type="button" class="btn-close" aria-label="Fermer" @click="${this.close}"></button><slot></slot></div>
    </div>
  </div>`
  }
}
/**
 * <div class="status-container" style="">
    <div class="status note mb-3 note-danger"><button type="button" class="btn-close" aria-label="Close"></button><p>Erreur lors du chargement des horaires dans la base de donnée.</p></div>
  </div>
 */

customElements.define('status-message', StatusMessage)
