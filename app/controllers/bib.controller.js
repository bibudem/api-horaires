import { Bib } from "../models/bib.js"

export async function listBibs(req, res, next) {
  res.json(await Bib.get())
}