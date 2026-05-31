import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import express from 'express'
import { OAuth2Client } from 'google-auth-library'
import {
  clearSessionCookie,
  createSession,
  deleteSession,
  getSessionUser,
  setSessionCookie,
  upsertGoogleUser,
} from './auth.js'
import { createUploadSignature } from './cloudinary.js'
import { checkDatabaseConnection, initializeDatabase } from './db.js'
import {
  createHelpRequest,
  listOpenHelpRequests,
  listUserHelpRequests,
  parseHelpRequestInput,
} from './helpRequests.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT) || 5000
const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClient = new OAuth2Client(googleClientId)

app.use(
  cors({
    credentials: true,
    origin: ['http://localhost:5173', 'http://localhost:5174'],
  }),
)
app.use(cookieParser())
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

    if (!payload?.sub || !payload.email || !payload.email_verified) {
      response.status(401).json({ message: 'Google account email is not verified.' })
      return
    }

    const user = await upsertGoogleUser({
      googleId: payload.sub,
      email: payload.email,
      fullName: payload.name || payload.email,
      picture: payload.picture,
    })
    const session = await createSession(user.id)

    setSessionCookie(response, session.token, session.expiresAt)

    response.json({
      user,
    })
  } catch {
    response.status(401).json({ message: 'Invalid Google credential.' })
  }
})

app.get('/api/auth/me', async (request, response) => {
  const user = await getSessionUser(request)

  if (!user) {
    response.status(401).json({ message: 'Not authenticated.' })
    return
  }

  response.json({ user })
})

app.post('/api/auth/logout', async (request, response) => {
  await deleteSession(request)
  clearSessionCookie(response)
  response.status(204).send()
})

app.post('/api/media/upload-signature', async (request, response) => {
  const user = await getSessionUser(request)

  if (!user) {
    response.status(401).json({ message: 'Not authenticated.' })
    return
  }

  if (user.status !== 'APPROVED') {
    response.status(403).json({ message: 'Your account must be approved before uploading media.' })
    return
  }

  try {
    response.json(createUploadSignature('authority-documents'))
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Cloudinary upload is not configured.',
    })
  }
})

app.get('/api/help-requests', async (_request, response) => {
  const helpRequests = await listOpenHelpRequests()

  response.json({ helpRequests })
})

app.get('/api/me/help-requests', async (request, response) => {
  const user = await getSessionUser(request)

  if (!user) {
    response.status(401).json({ message: 'Not authenticated.' })
    return
  }

  const helpRequests = await listUserHelpRequests(user.id)

  response.json({ helpRequests })
})

app.post('/api/help-requests', async (request, response) => {
  const user = await getSessionUser(request)

  if (!user) {
    response.status(401).json({ message: 'Not authenticated.' })
    return
  }

  if (user.status !== 'APPROVED') {
    response.status(403).json({ message: 'Your account must be approved before posting requests.' })
    return
  }

  try {
    const input = parseHelpRequestInput(request.body)
    const helpRequest = await createHelpRequest(input, user)

    response.status(201).json({ helpRequest })
  } catch (error) {
    response.status(400).json({
      message: error instanceof Error ? error.message : 'Invalid request.',
    })
  }
})

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`)
      console.log('Database connected.')
    })
  })
  .catch(() => {
    console.error('Database initialization failed.')
    process.exit(1)
  })
