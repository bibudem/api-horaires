
import mysql from 'mysql2/promise'
import config from 'config'

export const connection = await mysql.createPool(config.get('db.connectionSettings'))

export const rwConnection = await mysql.createPool({ ...config.get('db.connectionSettingsRW'), namedPlaceholders: true })