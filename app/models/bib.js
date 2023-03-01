import { connection } from '../db/index.js'
import codeBibs from 'code-bib'

export class Bib {
  static async get() {
    const [rows] = await connection.execute(`SELECT DISTINCT bibliotheque FROM production;`)
    const result = {}

    for (const row of rows) {
      const bibKey = row.bibliotheque
      if (Reflect.has(codeBibs, bibKey)) {
        result[bibKey] = codeBibs[bibKey].long;
      }
    }

    return result
  }
}