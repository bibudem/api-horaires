import { DateTime, Duration } from 'luxon'

// const RE_XSDATE = /^(?<year>\d{4})-(?<month>0?[1-9]|1[012])-(?<day>0[1-9]|[12][0-9]|3[01])((?<offset>[-+](2[0-3]|[01]?[0-9]):([0-5]?[0-9]))|(?<zulu>Z))?$/i //xs:date
const RE_XSDATE = /^(?<year>\d{4})-(?<month>0?[1-9]|1[012])-(?<day>0[1-9]|[12][0-9]|3[01])(T(?<hour>[0-2][0-9]):(?<minute>[0-6][0-9]):(?<second>[0-6][0-9])(?<secondFraction>\.\d+)?)?((?<offset>[-+](2[0-3]|[01]?[0-9]):([0-5]?[0-9]))|(?<zulu>Z))?$/i // xs:dateTime

function isValidXSDate(string) {
  return RE_XSDATE.test(string)
}

export function formatHour(h) {
  if (h === null) {
    throw new Error(`The hour parameter must be a string.`)
  }
  if (h === '23:59') {
    h = '24:00'
  }

  h = `${parseFloat(h.replace(':', '.'))}`
  const f = h.split('.')[1]
  if (f && f.length == 1) {
    h += '0'
  }

  h = h.replace('.', 'h')
  if (h.indexOf('h') === -1) {
    h += 'h'
  }

  return h
}

function fromXSDDate(str) {
  if (!isValidXSDate(str)) {
    throw new Error(`Mauvais format de date: '${str}'`)
  }

  const { groups } = RE_XSDATE.exec(str)
  const { year, month, day, offset, zulu } = groups
  const zone = zulu ? 'utc' : offset ? `UTC${offset}` : null
  const out = DateTime.fromObject({ year, month, day }, { zone })
  return out
}

/*
 * parseDate(date, base)
 *
 * Paramètres
 *
 * 	date (obligatoire): Date ou durée
 * 	base (facultatif) : Date. Date de base sur laquelle la durée est évaluée
 */
export function parseDate(date, base) {
  const reDurationTest = /^(?:-)?P/i

  let computedDate

  if (arguments.length == 1) {
    base = DateTime.now().set({ hours: 0, minute: 0, second: 0, millisecond: 0 })
  } else {
    if (!isValidXSDate(base)) {
      throw new Error(`Mauvais format de date: '${base}'`)
    }
    base = DateTime.fromISO(base)
  }

  if (reDurationTest.test(date)) {
    const duration = Duration.fromISO(date)

    if (duration.invalid) {
      throw new Error(`Mauvais format de durée: '${date}'`)
    }

    computedDate = base.plus(duration)
  } else {
    if (!isValidXSDate(date)) {
      throw new Error(`Mauvais format de date: '${date}'`)
    }
    // computedDate = DateTime.fromISO(date)
    computedDate = fromXSDDate(date)

    if (computedDate.invalid) {
      throw new Error(`Mauvais format de date: '${date}'`)
    }
  }

  return computedDate.toSQLDate()
}
