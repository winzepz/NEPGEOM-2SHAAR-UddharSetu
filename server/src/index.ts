import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { OAuth2Client } from 'google-auth-library'
import { checkDatabaseConnection } from './db.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT) || 5000
const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClient = new OAuth2Client(googleClientId)

app.use(cors())
app.use(express.json())

app.get('/api/health', async (_request, response) => {
  try {
    await checkDatabaseConnection()

    response.json({
      status: 'ok',
      service: 'UddharSetu API',
      database: 'connected',
    })
  } catch {
    response.status(503).json({
      status: 'degraded',
      service: 'UddharSetu API',
      database: 'unavailable',
    })
  }
})

app.post('/api/auth/google', async (request, response) => {
  const credential = request.body?.credential

  if (!googleClientId) {
    response.status(500).json({ message: 'Google OAuth client ID is not configured.' })
    return
  }

  if (typeof credential !== 'string') {
    response.status(400).json({ message: 'Google credential is required.' })
    return
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    })
    const payload = ticket.getPayload()

    response.json({
      user: {
        email: payload?.email,
        name: payload?.name,
        picture: payload?.picture,
        googleId: payload?.sub,
      },
    })
  } catch {
    response.status(401).json({ message: 'Invalid Google credential.' })
  }
})

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})

checkDatabaseConnection()
  .then(() => console.log('Database connected.'))
  .catch(() => console.error('Database connection failed.'))
