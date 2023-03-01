import { join } from 'node:path'
import express, { Router } from 'express'
import { fileURLToPath } from 'node:url';

const adminRoute = Router();

// adminRoute.use(express.static(join(__dirname, '..', 'public', 'admin')))
adminRoute.use(express.static(fileURLToPath(new URL('../public/admin', import.meta.url))))

export default adminRoute