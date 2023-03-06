import Button from 'mdb-ui-kit/src/js/free/button.js'
import Ripple from 'mdb-ui-kit/src/js/free/ripple.js'
import 'smart-webcomponents/source/smart.element.js'
import 'smart-webcomponents/source/smart.progressbar.js'
import spinnerSvg from '../icons/spinner.svg'

import '../scss/main.scss'

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
  spinner.classList.remove('is-rolling')
  spinner.addEventListener(
    'transitionend',
    () => {
      submitBtn.disabled = false
      spinner.remove()
    },
    { once: true }
  )
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

    try {
      const abortController = new AbortController()
      requestTimeoutHandle = setTimeout(() => abortController.abort(), 8000)

      const response = await fetch(submitForm.action, { method: submitForm.method, signal: abortController.signal })

      clearTimeout(requestTimeoutHandle)
      requestTimeoutHandle = setTimeout(() => abortController.abort(), 8000)

      const reader = response.body.getReader() // get the response stream
      let result

      progressBar.indeterminate = false

      // Loop indefinitely while the response comes in (I don't think this is blocking)
      while (true) {
        const { done, value } = await reader.read() // value will be the byes of the latest response
        if (done) {
          progressBar.value = 100

          break // exit the loop
        }

        const { message, data } = decodeMessage(value)

        if (message === 'result') {
          result = JSON.parse(data)
        } else {
          progressBar.value = Math.trunc(parseFloat(data) * 1e4) / 1e2
        }
      }

      // After the response is done
      progressBar.querySelector('.smart-value').addEventListener(
        'transitionend',
        () => {
          resetSubmitBtn()

          setTimeout(() => {
            progressBar.hidden = true
          }, 200)

          if (response.ok) {
            console.log(`Done! %o`, result)
            resolve(result)
          } else {
            reject(result)
          }
        },
        { once: true }
      )
    } catch (error) {
      console.log('catch')
      if (error.name === 'AbortError') {
        // Notify the user of abort.
        // Note this will never be a timeout error!
        console.log('Request aborted: %o', error)
      } else {
        // A network error, or some other problem.
        console.log(`Type: ${error.name}, Message: ${error.message}`)
      }
      reject(error)
    } finally {
      console.log('finally')
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
    if (error.name === 'AbortError') {
      // Notify the user of abort.
      // Note this will never be a timeout error!
      console.log('Request aborted: %o', error)
    } else {
      // A network error, or some other problem.
      console.log(`Type: ${error.name}, Message: ${error.message}`)
    }
  }
})

// submitForm.addEventListener('submit', async event => {
//   event.preventDefault()
//   if (submitBtn.disabled) {
//     return
//   }

//   progressBar.hidden = false
//   progressBar.indeterminate = true
//   submitBtn.disabled = true
//   submitBtn.prepend(spinner)
//   requestAnimationFrame(() => spinner.classList.add('is-rolling'))

//   if (!statusContainer.classList.contains('collapsed')) {
//     await toggleElement(statusContainer, 'collapsed')
//     status.innerHTML = ''
//     status.classList.remove(status._statusClass)
//     delete status._statusClass
//   }

//   let requestTimeoutHandle

//   try {
//     const abortController = new AbortController()
//     requestTimeoutHandle = setTimeout(() => abortController.abort(), 8000)

//     const response = await fetch(submitForm.action, { method: submitForm.method, signal: abortController.signal })

//     clearTimeout(requestTimeoutHandle)
//     requestTimeoutHandle = setTimeout(() => abortController.abort(), 8000)

//     const reader = response.body.getReader() // get the response stream
//     let result

//     progressBar.indeterminate = false

//     // Loop indefinitely while the response comes in (I don't think this is blocking)
//     while (true) {
//       const { done, value } = await reader.read() // value will be the byes of the latest response
//       if (done) {
//         progressBar.value = 100

//         setTimeout(resetSubmitBtn, 300)

//         setTimeout(() => {
//           progressBar.hidden = true
//         }, 250)

//         break // exit the loop
//       }

//       const { message, data } = decodeMessage(value)

//       if (message === 'result') {
//         result = JSON.parse(data)
//       } else {
//         progressBar.value = Math.trunc(parseFloat(data) * 1e4) / 1e2
//       }
//     }

//     // After the response is done
//     if (response.ok) {
//       console.log(`Done! %o`, result)
//       const statusClass = result.status < 500 ? 'note-success' : 'note-danger'

//       let message = `<h3>Importation complétée</h3><p>${result.insertedRows === 0 ? 'Aucun' : n(result.insertedRows)} ${result.insertedRows === 0 ? 'nouvel' : 'nouveaux'} horaire${s(result.insertedRows)} importé${s(result.insertedRows)}. ${result.updatedRows === 0 ? 'Aucun' : n(result.updatedRows)} horaire${s(result.updatedRows)} mise${s(result.updatedRows)} à jour.</p><p>Les horaires traités sont compris entre le ${d(result.minDate)} et le ${d(result.maxDate)} inclusivement.</p>`

//       if (result.errorMessages.length) {
//         message += `<p class="">${result.errorMessages.join(' ')}</p>`
//       }

//       setTimeout(() => updateStatusMessage(statusClass, message), 250)
//     } else {
//       updateStatusMessage('note-danger', `<p>${result.errorMessages.join(' ')}</p>`)
//     }
//   } catch (error) {
//     console.log('catch')
//     if (error.name === 'AbortError') {
//       // Notify the user of abort.
//       // Note this will never be a timeout error!
//       console.log('Request aborted: %o', error)
//     } else {
//       // A network error, or some other problem.
//       console.log(`Type: ${error.name}, Message: ${error.message}`)
//     }
//   } finally {
//     console.log('finally')
//     clearTimeout(requestTimeoutHandle)
//   }
// })

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
