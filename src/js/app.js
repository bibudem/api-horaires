import Button from 'mdb-ui-kit/src/js/free/button.js'
import Ripple from 'mdb-ui-kit/src/js/free/ripple.js'
import 'smart-webcomponents/source/smart.element.js'
import 'smart-webcomponents/source/smart.progressbar.js'
import spinnerSvg from '../icons/spinner.svg'

import '../scss/app.scss'

const spinner = (svg => {
  const div = document.createElement('div')
  div.innerHTML = svg
  return div.firstChild
})(spinnerSvg)

const decoder = new TextDecoder() // This will convert the Uint8Array of bytes into ASCII text

const n = new Intl.NumberFormat('fr-CA').format

const _d = new Intl.DateTimeFormat('fr-CA', { dateStyle: 'long' }).format

function d(dateString) {
  return _d(new Date(dateString))
}

function s(n) {
  return n ? 's' : ''
}

function decodeMessage(value) {
  return /^(?<message>\w+):(?<data>.+)$/.exec(decoder.decode(value)).groups
}

function toggleElement(elem, collapseClass) {
  return new Promise(resolve => {
    // debugger;
    elem.style.height = ''
    elem.style.transition = 'none'

    const startHeight = window.getComputedStyle(elem).height

    // Remove the collapse class, and force a layout calculation to get the final height
    elem.classList.toggle(collapseClass)
    const height = window.getComputedStyle(elem).height

    // Set the start height to begin the transition
    elem.style.height = startHeight

    // wait until the next frame so that everything has time to update before starting the transition
    requestAnimationFrame(() => {
      elem.style.transition = ''

      requestAnimationFrame(() => {
        elem.style.height = height
      })
    })

    function onTransitionend() {
      elem.style.height = ''
      elem.removeEventListener('transitionend', onTransitionend)
      resolve()
    }

    // Clear the saved height values after the transition
    elem.addEventListener('transitionend', onTransitionend)
  })
}

function updateStatusMessage(statusClass, message) {
  if (status._statusClass) {
    status.classList.remove(status._statusClass)
  }
  status.classList.add(statusClass)
  status._statusClass = statusClass
  status.innerHTML = '<button type="button" class="btn-close" aria-label="Close"></button>' + message

  if (statusContainer.classList.contains('collapsed')) {
    toggleElement(statusContainer, 'collapsed')
  }
}

function resetSubmitBtn() {
  return new Promise(resolve => {
    function doResetSubmitBtn() {
      submitBtn.disabled = false
      spinner.remove()
    }

    function resetProgressBar() {
      progressBar.hidden = true
      progressBar.indeterminate = false
      progressBar.value = 0
    }

    spinner.addEventListener('transitionend', doResetSubmitBtn, { once: true })

    spinner.classList.remove('is-rolling')

    if (!progressBar.hidden) {
      if (!progressBar.indeterminate && progressBar.value > 0) {
        progressBar.querySelector('.smart-value').addEventListener(
          'transitionend',
          () => {
            resetProgressBar()
            resolve()
          },
          { once: true }
        )
      } else {
        setTimeout(() => {
          resetProgressBar()
          resolve()
        }, 200)
      }
    }
  })
}

async function closeStatus() {
  await toggleElement(statusContainer, 'collapsed')
  status.innerHTML = ''
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

      clearTimeout(requestTimeoutHandle)

      const reader = response.body.getReader() // get the response stream

      progressBar.indeterminate = false

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
          progress = parseFloat(data)
          // console.log(progress)
          progressBar.value = progress
        }
      }

      // After the response is done
      await resetSubmitBtn()

      if (response.ok) {
        resolve(result)
      } else {
        reject(result)
      }
    } catch (error) {
      console.log('catch')
      progressBar.hidden = true
      progressBar.indeterminate = false

      if (error.name === 'AbortError') {
        // Notify the user of abort.
        // Note this will never be a timeout error!
        console.log('Request aborted: %o', error)
        reject({ errorMessages: ["Le serveur LibCal n'a pu être rejoint dans le délai imparti."] })
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
const statusContainer = document.querySelector('.status-container')
const status = document.querySelector('.status')

status.addEventListener('click', event => {
  if (event.target.matches('.btn-close')) {
    closeStatus()
  }
})

submitForm.addEventListener('submit', async event => {
  event.preventDefault()
  if (submitBtn.disabled) {
    return
  }

  if (!statusContainer.classList.contains('collapsed')) {
    await toggleElement(statusContainer, 'collapsed')
    status.innerHTML = ''
    status.classList.remove(status._statusClass)
    delete status._statusClass
  }

  try {
    const result = await importHoraires()
    // After the response is done
    if (result.status < 500) {
      let message = '<h3>Importation complétée</h3>'

      message += `<p>${result.insertedRows === 0 ? 'Aucun' : n(result.insertedRows)} ${result.insertedRows === 0 ? 'nouvel' : 'nouveaux'} horaire${s(result.insertedRows)} importé${s(result.insertedRows)}. ${result.updatedRows === 0 ? 'Aucun' : n(result.updatedRows)} horaire${s(result.updatedRows)} mise${s(result.updatedRows)} à jour.</p>`

      if (result.minDate) {
        message += `<p>Les horaires traités sont compris entre le ${d(result.minDate)} et le ${d(result.maxDate)} inclusivement.</p>`
      }

      if (result.errorMessages.length) {
        message += `<p class="">${result.errorMessages.join(' ')}</p>`
      }

      updateStatusMessage('note-success', message)
    } else {
      updateStatusMessage('note-danger', `<p>${result.errorMessages.join(' ')}</p>`)
    }
  } catch (error) {
    console.log('catch')
    console.log(error)
    updateStatusMessage('note-danger', `<p>${error.errorMessages.join(' ')}</p>`)
  }
})

// Liste des bibliothèques

fetch('../liste')
  .then(response => response.json())
  .then(data => {
    const listeBibs = document.querySelector('#liste-bibs')
    for (const key in data) {
      const bib = data[key]
      const tr = document.createElement('tr')
      tr.innerHTML = '<td><code>' + key + '</code></td><td>' + bib + '</td>'
      listeBibs.append(tr)
    }
  })

// Liste des

fetch('../services')
  .then(response => response.json())
  .then(data => {
    const listeServices = document.querySelector('#liste-services')
    for (const key in data) {
      const service = data[key]
      const tr = document.createElement('tr')
      tr.innerHTML = '<td><code>' + key + '</code></td><td>' + service.label + '</td>'
      listeServices.append(tr)
    }
  })
