import Button from 'mdb-ui-kit/src/js/free/button.js'
import Ripple from 'mdb-ui-kit/src/js/free/ripple.js'
import 'smart-webcomponents/source/smart.element.js'
import 'smart-webcomponents/source/smart.progressbar.js'

import './status-message.js'
import spinnerSvg from '../icons/spinner.svg'

import '../scss/app.scss'

const spinner = (svg => {
  const div = document.createElement('div')
  div.innerHTML = svg
  return div.firstChild
})(spinnerSvg)

const decoder = new TextDecoder('utf-8', { fatal: true }) // This will convert the Uint8Array of bytes into ASCII text

const n = new Intl.NumberFormat('fr-CA').format

const _d = new Intl.DateTimeFormat('fr-CA', { dateStyle: 'long' }).format

function d(dateString) {
  return _d(new Date(dateString))
}

function s(n) {
  return n ? 's' : ''
}

function decodeMessage(value) {
  try {
    const str = decoder.decode(value)
    return /^(?<message>\w+):(?<data>.+)$/.exec(str).groups
  } catch (error) {
    console.error(error)
    throw error
  }
}

function updateStatusMessage(type, message) {
  const toast = document.createElement('status-message')
  toast.role = 'alert'
  toast.ariaLive = 'assertive'
  toast.ariaAtomic = 'true'
  toast.type = type
  toast.innerHTML = message
  document.querySelector('.submit-form').after(toast)
}

function resetProgressBar() {
  return new Promise(resolve => {
    function doResetProgressBar() {
      progressBar.hidden = true
      progressBar.indeterminate = false
      progressBar.value = 0
    }

    if (!progressBar.hidden) {
      if (!progressBar.indeterminate && progressBar.value > 0) {
        progressBar.querySelector('.smart-value').addEventListener(
          'transitionend',
          () => {
            doResetProgressBar()
            resolve()
          },
          { once: true }
        )
      } else {
        setTimeout(() => {
          doResetProgressBar()
          resolve()
        }, 200)
      }
    } else {
      resolve()
    }
  })
}

function resetSubmitBtn() {
  return new Promise(resolve => {
    function doResetSubmitBtn() {
      submitBtn.disabled = false
      spinner.remove()
      resolve()
    }

    spinner.addEventListener('transitionend', doResetSubmitBtn, { once: true })

    spinner.classList.remove('is-rolling')
  })
}

async function importHoraires() {
  return new Promise(async (resolve, reject) => {
    progressBar.hidden = false
    progressBar.indeterminate = true
    submitBtn.disabled = true
    submitBtn.prepend(spinner)
    requestAnimationFrame(() => spinner.classList.add('is-rolling'))

    let requestTimeoutHandle
    let progress = 0
    let result

    try {
      const abortController = new AbortController()
      requestTimeoutHandle = setTimeout(() => abortController.abort(), 8000)

      const response = await fetch(submitForm.action, { method: submitForm.method, signal: abortController.signal })

      // After the response is done
      // resetSubmitBtn()

      clearTimeout(requestTimeoutHandle)

      progressBar.indeterminate = false

      const reader = response.body.getReader() // get the response stream

      // Loop indefinitely while the response comes in (I don't think this is blocking)
      while (true) {
        const { done, value } = await reader.read() // value will be the byes of the latest response
        if (done) {
          break // exit the loop
        }

        const { message, data } = decodeMessage(value)

        if (message === 'result') {
          result = JSON.parse(data)
        } else {
          progressBar.value = parseFloat(data)
        }
      }

      // Progress is finished
      await Promise.all([resetProgressBar(), resetSubmitBtn()])

      if (response.ok) {
        resolve(result)
      } else {
        reject(result)
      }
    } catch (error) {
      // After the response is done
      await Promise.all([resetProgressBar(), resetSubmitBtn()])

      if (error.name === 'AbortError') {
        // Notify the user of abort.
        // Note this will never be a timeout error!
        console.log('Request aborted: %o', error)
        reject({ errorMessages: ["Le serveur LibCal n'a pu être rejoint dans le délai prévu."] })
      } else {
        // A network error, or some other problem.
        console.log(`Type: ${error.name}, Message: ${error.message}`)
        reject(error)
      }
    } finally {
      clearTimeout(requestTimeoutHandle)
    }
  })
}

const submitForm = document.querySelector('.submit-form')
const submitBtn = document.querySelector('.submit-btn')
const progressBar = document.querySelector('#import-progress')

submitForm.addEventListener('submit', async event => {
  event.preventDefault()
  if (submitBtn.disabled) {
    return
  }

  try {
    const statusMessageElem = document.querySelector('status-message')

    if (statusMessageElem) {
      await statusMessageElem.close()
    }

    const result = await importHoraires()
    // After the response is done

    if (result.status < 500) {
      let message = '<h3>Importation terminée</h3>'

      message += `<p>${result.insertedRows === 0 ? 'Aucun' : n(result.insertedRows)} ${result.insertedRows === 0 ? 'nouvel' : 'nouveaux'} horaire${s(result.insertedRows)} importé${s(result.insertedRows)}. ${result.updatedRows === 0 ? 'Aucun' : n(result.updatedRows)} horaire${s(result.updatedRows)} mise${s(result.updatedRows)} à jour.</p>`

      if (result.minDate) {
        message += `<p>Les horaires traités sont compris entre le ${d(result.minDate)} et le ${d(result.maxDate)} inclusivement.</p>`
      }

      if (result.errorMessages.length) {
        message += `<p>${result.errorMessages.join(' ')}</p>`
      }

      updateStatusMessage('success', message)
    } else {
      updateStatusMessage('error', `<p>${result.errorMessages.join(' ')}</p>`)
    }
  } catch (error) {
    console.dir(error)
    updateStatusMessage('error', `<p>${error.errorMessages.join(' ')}</p>`)
  }
})

// Liste des bibliothèques

fetch('../liste')
  .then(async response => {
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message)
    }

    const ret = []

    for (const [key, label] of Object.entries(data)) {
      ret.push({ key, label })
    }

    ret.sort((a, b) => {
      const labelA = a.label.toUpperCase() // ignore upper and lowercase
      const labelB = b.label.toUpperCase() // ignore upper and lowercase
      if (labelA < labelB) {
        return -1
      }
      if (labelA > labelB) {
        return 1
      }

      // names must be equal
      return 0
    })

    return ret
  })
  .then(data => {
    const listeBibs = document.querySelector('#liste-bibs')
    for (const bib of data) {
      const tr = document.createElement('tr')
      tr.innerHTML = '<td>' + bib.label + '</td><td><code>' + bib.key + '</code></td>'
      listeBibs.append(tr)
    }
  })
  .catch(async error => {
    // toast({ html: 'error.message' })
    const toast = document.createElement('status-message')
    toast.role = 'alert'
    toast.ariaLive = 'assertive'
    toast.ariaAtomic = 'true'
    toast.type = 'error'
    toast.innerHTML = `<p>Erreur lors de la récupération de la liste des bibliothèques.</p><p>Message: ${error.message}</p`
    document.querySelector('.table-responsive').after(toast)
  })

// Liste des

fetch('../services')
  .then(response => response.json())
  .then(data => {
    const ret = []
    for (const service of Object.values(data)) {
      ret.push(service)
    }

    return ret.sort((a, b) => a.order - b.order)
  })
  .then(data => {
    const listeServices = document.querySelector('#liste-services')
    for (const service of data) {
      const tr = document.createElement('tr')
      tr.innerHTML = '<td>' + service.label + '</td><td><code>' + service.key + '</code></td>'
      listeServices.append(tr)
    }
  })
