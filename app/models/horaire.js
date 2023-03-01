import { EventEmitter } from 'node:events'
import axios from 'axios'
import { DateTime } from 'luxon'
import config from 'config'
import codeBibs from 'code-bib'
import nodeGlobalProxy from 'node-global-proxy'
import { connection, rwConnection } from '../db/index.js'
import { ImportHoraires } from '../lib/import-horaires.js'
import { formatHour } from '../lib/dateTime-utils.js'
import { toICS } from '../lib/to-ICS.js'
import console from '../lib/console.js'

const services = config.get('services')
const periodes = config.get('periodes')

const upsertSql = `INSERT INTO production (date, bibliotheque, jour, debut1, fin1, debut2, fin2, periode, service, sommaire)
    VALUES
        ( :date, :bibliotheque, '', :debut1, :fin1, :debut2, :fin2, :periode, :service, :sommaire )
    ON DUPLICATE KEY UPDATE 
        debut1 = :debut1,
        fin1 = :fin1,
        debut2 = :debut2,
        fin2 = :fin2,
        periode = :periode,
        sommaire = :sommaire;
`

const proxy = nodeGlobalProxy.default

// Setting up proxy if needed

if (config.get('httpClient.proxy')) {

  console.debug('Using proxy settings')

  proxy.setConfig(config.get('httpClient.proxy'))
  proxy.start()

}

const bibLabels = new Map();
const servicesLabels = new Map();

// patch
codeBibs.mi.court = 'Mathématiques et informatique'

Object.keys(codeBibs).forEach(codeBib => {
  bibLabels.set(codeBibs[codeBib].long, codeBib)
  bibLabels.set(codeBibs[codeBib].court, codeBib)
})

Object.keys(services).forEach(serviceKey => {
  servicesLabels.set(services[serviceKey].label, serviceKey)
});

function toUID(id) {
  return id + '@bib.umontreal.ca';
}

function setOrder() {
  const servicesLength = Object.keys(services).length

  return `ORDER BY
  bibliotheque,
  date,
  (
    CASE LOWER(service)${Object.keys(services).map(key => `
      WHEN '${key.toLowerCase()}' THEN ${services[key].order || servicesLength}`).join(' ')}
      ELSE ${servicesLength}
    END
  )`
}

/**
 * Un code de bibliothèque ou une liste de codes de bibliothèque
 * @typedef {string|string[]|null} bibParam
 * 
 */

/**
 *
 *
 * @export
 * @class Horaire
 */
export class Horaire {

  /**
   *
   *
   * @static
   * @param {object} params - Les paramètres de recherche
   * @param {bibParam} [params.bib = nul] - Le ou les codes de bibliothèque
   * @param {string} [params.debut] - La date de début
   * @param {string} [params.fin] - La date de fin
   * @param {boolean} [ouvert = false] - Filtre uniquement les horaires dont les bibliothèques sont ouvertes en ce moment ou non
   * 
   * @returns
   * @memberof Horaire
   */
  static async get({
    bib = null,
    debut = DateTime.fromISO({ hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }).toSQLDate(),
    fin = DateTime.local(9999, 12, 31, 23, 59, 59, 999).toSQLDate(),
    ouvert = false
  }) {

    let query = ''
    let bibCondition = ''
    let select = `SELECT
  id,
  date,
  bibliotheque,
  debut1,
  fin1,
  debut2,
  fin2,
  service,
  periode,
  sommaire
FROM
  production 
WHERE`

    if (typeof bib === 'string') {
      bib = [bib];
    }

    if (bib && bib.length) {
      bibCondition = `AND (
    ${bib.map(b => `bibliotheque='${b}'`).join(`
    OR `)}
  )`
    }

    if (ouvert) {
      query = `
(
  ${select}
  (
    (SELECT CONCAT(date, 'T', debut1)) >= '${debut}' and '${fin}' >= (SELECT CONCAT(date, 'T', debut1)) )
  ${bibCondition}
)
UNION
(
  ${select}
    ( (SELECT CONCAT(date, 'T', fin2)) >= '${debut}' and '${fin}' >= (SELECT CONCAT(date, 'T', fin2)) )
  ${bibCondition}
)
UNION
(
  ${select}
    ( (SELECT CONCAT(date, 'T', debut1)) < '${debut}' and '${fin}' < (SELECT CONCAT(date, 'T', fin2)) )
  ${bibCondition}
);`
    } else {
      query = `${select}
  date >= '${debut}'
  AND date < '${fin}'
  ${bibCondition}
${setOrder()};`
    }

    const [rows] = await connection.execute(query);

    return new Horaire(rows, { ouvert })
  }

  // /**
  //  *
  //  *
  //  * @static
  //  * @param {object} params - Les paramètres de recherche
  //  * @param {bibParam} [params.bib = nul] - Le ou les codes de bibliothèque
  //  * @param {string} [params.debut] - La date de début
  //  * @param {string} [params.fin] - La date de fin
  //  * @param {boolean} [ouvert = false] - Filtre uniquement les horaires dont les bibliothèques sont ouvertes en ce moment ou non
  //  * 
  //  * @returns
  //  * @memberof Horaire
  //  */
  // static async update() {
  //   return new PProgress((resolve, reject, progress) => {
  //     const importer = new ImportHoraires()

  //     importer.on('progress', progress => {
  //       console.log(`${Math.round(progress * 100)}%`)
  //     })

  //     const result = await importer.import()

  //     console.log('result: ', result)
  //   })
  // }

  constructor(rows, options = {}) {

    Object.defineProperty(this, 'total', {
      enumerable: true,
      get() {
        return this.evenements?.length ?? 0
      }
    })

    if (rows.length > 0) {

      const bibKeys = new Map()
      const servicesKeys = new Map()
      const periodesKeys = new Map()

      const evenements = []

      for (const row of rows) {

        const event = new Evenement(row)

        if ((event.debut1 === '' && event.fin2 === '') || (event.debut1 === null && event.fin2 === null)) {
          if (options.ouvert) {
            // This service is closed and the request is only for opened services,
            // so stop processing this current iteration of the loop
            continue
          }
        }

        bibKeys.set(event.bibliotheque, codeBibs[event.bibliotheque])
        servicesKeys.set(event.service, services[event.service])
        periodesKeys.set(event.periode, periodes[event.periode])

        evenements.push(event)
      }

      if (evenements.length) {

        this.evenements = evenements

        this.labels = {
          bibs: {},
          services: {},
          periodes: {}
        }

        bibKeys.forEach((v, k) => {
          this.labels.bibs[k] = v.long
        })

        servicesKeys.forEach((v, k) => {
          this.labels.services[k] = v.label
        })

        periodesKeys.forEach((v, k) => {
          this.labels.periodes[k] = v
        })

      }
    }
  }

  toICS() {
    return toICS(this)
  }
}

export default class Evenement {
  constructor(data) {

    if (!codeBibs.hasOwnProperty(data.bibliotheque)) {
      const msg = `The requested bib cannot be found in module 'code-bib': ${data.bibliotheque}.`
      throw (msg);
    }

    if (!services.hasOwnProperty(data.service)) {
      const msg = `The service '${data.service}' found in record id=${data.id} does not match any configs. ${JSON.stringify(data)}`;
      throw (msg);
    }

    if (!periodes.hasOwnProperty(data.periode)) {
      const msg = `The periode '${data.periode}' found in record id=${data.id} does not match any configs. ${JSON.stringify(data)}`;
      throw (msg);
    }

    Object.assign(this, data);

    ['debut1', 'fin1', 'debut2', 'fin2'].forEach(key => {
      if (key in this && this[key] === null) {
        this[key] = '';
      }
    });

    if (typeof this.sommaire === 'undefined' || this.sommaire === null) {

      let sommaire;

      // Champ 'sommaire'
      if (this.debut1 === '' && this.fin2 === '') {
        sommaire = 'fermé';
      } else if (this.debut1 === '00:00' && this.fin2 === '24:00') {
        sommaire = 'ouvert 24h';
      } else {
        sommaire = `${formatHour(this.debut1)} à\xA0`;
        if (this.fin1 !== '' && this.debut2 !== '') {
          sommaire += `${formatHour(this.fin1)}\xA0et ${formatHour(this.debut2)} à\xA0`;
        }
        sommaire += formatHour(this.fin2);
      }

      this.sommaire = sommaire;
    }
    this.id = toUID(data.id);
  }
}

export class HorairesImporter extends EventEmitter {

  async import() {

    const result = {
      insertedRows: 0,
      updatedRows: 0,
      errorMessages: []
    }

    try {
      const data = await axios.get('https://umontreal.libcal.com/widget/hours/grid?iid=4151&format=json&weeks=52&systemTime=1')
        .then(response => {
          return response.data.locations
        })

      const evenements = [];
      const bibs = data.filter(bib => typeof bib.parent_lid === 'undefined')
      const services = data.filter(bib => typeof bib.parent_lid !== 'undefined')

      bibs.forEach(iCalBib => {
        if (!bibLabels.has(iCalBib.name)) {
          // throw new Error(`The library \`${iCalBib.name}\` (lid #${iCalBib.lid}) is unknown.`);
          result.errorMessages.push(`La bibliothèque \`${iCalBib.name}\` (lid #${iCalBib.lid}) est inconnue.`);
          return;
        }

        //
        // Bibliothèque
        //

        const codeBib = bibLabels.get(iCalBib.name)
        const evenementTemplate = {
          bibliotheque: codeBib,
          service: 'regulier',
          periode: 'regulier'
        }

        evenements.push(...libCalWeeksToEvenement(iCalBib.weeks, evenementTemplate))

        //
        // Services
        //

        services
          // Get all services for this bibliotheque
          .filter((iCalService) => {
            return iCalService.parent_lid === iCalBib.lid;
          })

          .forEach(iCalService => {
            if (!servicesLabels.has(iCalService.name)) {
              // throw new Error(`The service \`${iCalService.name}\` (lid #${iCalService.lid}) is unknown.`);
              result.errorMessages.push(`Le service \`${iCalService.name}\` (lid #${iCalService.lid}) est inconnu.`);
              return;
            }

            const codeService = servicesLabels.get(iCalService.name)
            const evenementTemplate = {
              bibliotheque: codeBib,
              service: codeService,
              periode: 'regulier'
            }

            evenements.push(...libCalWeeksToEvenement(iCalService.weeks, evenementTemplate))
          })
      });

      /*
        {
            bibliotheque: 'antenne-paramedicale',
            service: 'regulier',
            periode: 'regulier',
            date: '2023-06-04',
            debut1: '07:00',
            fin1: '',
            debut2: '',
            fin2: '23:00',
            sommaire: '7h à 23h'
          },
  */

      /*
 [
  ResultSetHeader {
    fieldCount: 0,
    affectedRows: 1,
    insertId: 0,
    info: '',
    serverStatus: 2,
    warningStatus: 0
  },
  undefined
]
*/
      const totalEvenements = evenements.length

      for (const [i, ev] of evenements.entries()) {
        // evenements.forEach(async ev => {
        try {
          const [resultSet] = await rwConnection.query(upsertSql, ev)
          if (resultSet.insertId > 0) {
            result.insertedRows++
          } else {
            result.updatedRows++
          }

          this.emit('progress', i / totalEvenements)

        } catch (error) {
          console.error(error)
          throw error
        }
      }

      if (result.errorMessages.length > 0) {
        result.status = 422;
        return result
      }

      result.status = 200;
      return result

    } catch (e) {
      console.error(e)
      result.error = e;
      result.status = 500
      throw result
    }
  }
}

function libCalWeeksToEvenement(weeks, evenementTemplate) {
  const evenements = [];
  weeks.forEach(week => {
    Object.values(week).forEach(day => {
      const evenement = libCalToHoraire(day);
      if (evenement) {
        evenements.push({
          ...evenementTemplate,
          ...evenement
        })
      }
    })
  });
  return evenements;
}

function libCalToHoraire(data) {
  // console.log(JSON.stringify(data, null, 2))

  if (data.times.status === 'not-set') {
    return null;
  }

  let date = `${data.date}`,
    debut1 = '',
    fin1 = '',
    debut2 = '',
    fin2 = '',
    sommaire = '';

  if (data.times.status === 'closed') {
    debut1 = '';
    fin2 = '';
    sommaire = 'fermé';
  }

  else if (data.times.status === 'text') {
    sommaire = typeof data.times.text !== 'undefined' ? data.times.text : data.times.note;
  }

  else if (data.times.status === 'open') {
    debut1 = data.times.hours[0].from;

    if (data.times.hours.length === 1) {
      fin2 = data.times.hours[0].to;
      sommaire = `${formatHour(debut1)} à ${formatHour(fin2)}`
    } else {
      fin1 = data.times.hours[0].to;
      debut2 = data.times.hours[1].from;
      fin2 = data.times.hours[1].to;
      sommaire = `${formatHour(debut1)} à ${formatHour(fin1)} et ${formatHour(debut2)} à ${formatHour(fin2)}`
    }
  }

  else if (data.times.status === 'ByApp') {
    sommaire = 'Sur rendez-vous'
  }

  else {
    // 24hours
    debut1 = '00:00'
    fin2 = '24:00'
    sommaire = 'ouvert 24h'
  }

  return {
    date,
    debut1,
    fin1,
    debut2,
    fin2,
    sommaire
  };
}