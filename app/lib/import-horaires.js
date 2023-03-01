import { EventEmitter } from 'node:events'
import axios from 'axios'
import config from 'config'
import codesBib from 'code-bib'
import nodeGlobalProxy from 'node-global-proxy'
import { rwConnection } from '../db/index.js'
import { formatHour } from './dateTime-utils.js'
import console from './console.js'

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

const codesServices = config.get('services')

const bibLabels = new Map();
const servicesLabels = new Map();

// patch
codesBib.mi.court = 'Mathématiques et informatique'

Object.keys(codesBib).forEach(codeBib => {
  bibLabels.set(codesBib[codeBib].long, codeBib)
  bibLabels.set(codesBib[codeBib].court, codeBib)
})

Object.keys(codesServices).forEach(serviceKey => {
  servicesLabels.set(codesServices[serviceKey].label, serviceKey)
});


export class ImportHoraires extends EventEmitter {

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
        throw result
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


//
// ====================================================
//

// const ev = await horairesImporter()
// console.log(ev)