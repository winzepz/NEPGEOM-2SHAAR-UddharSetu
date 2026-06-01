import './env.js'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import express from 'express'
import type { NextFunction, Request, Response } from 'express'
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
import { listOpenHelpRequests, listUserHelpRequests } from './helpRequests.js'
import {
  getLatestUserKyc,
  listKycSubmissions,
  parseKycInput,
  parseReviewInput,
  reviewKycSubmission,
  submitKyc,
} from './kyc.js'
import {
  createReliefPost,
  listPublicPosts,
  listReviewPosts,
  listUserPosts,
  parsePostInput,
  reviewPost,
} from './posts.js'
import {
  initiatePayment,
  verifyPayment,
  createMaterialPledge,
  completeMaterialPledge,
} from './donations.js'

const app = express()
const port = Number(process.env.PORT) || 5000
const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClient = new OAuth2Client(googleClientId)

async function requireSuperAdmin(request: Request, response: Response, next: NextFunction) {
  const user = await getSessionUser(request)
  if (!user || user.role !== 'SUPER_ADMIN') {
    response.status(403).json({ message: 'Admin role required.' })
    return
  }
  response.locals.user = user
  next()
}

function getRouteParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

app.use(
  cors({
    credentials: true,
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
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

  let payload:
    | {
        sub?: string
        email?: string
        email_verified?: boolean
        name?: string
        picture?: string
      }
    | undefined

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    })
    payload = ticket.getPayload()
  } catch (error) {
    console.error('Google token verification failed:', error)
    response.status(401).json({ message: 'Invalid Google credential.' })
    return
  }

  if (!payload?.sub || !payload.email || !payload.email_verified) {
    response.status(401).json({ message: 'Google account email is not verified.' })
    return
  }

  try {
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
  } catch (error) {
    console.error('Google account session creation failed:', error)
    response.status(500).json({ message: 'Google sign-in succeeded, but the server could not create your session.' })
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

  const purpose = typeof request.body?.purpose === 'string' ? request.body.purpose : 'authority-documents'
  const folder = purpose === 'kyc' ? 'kyc-documents' : 'authority-documents'

  try {
    response.json(createUploadSignature(folder))
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Cloudinary upload is not configured.',
    })
  }
})

app.post('/api/kyc', async (request, response) => {
  const user = await getSessionUser(request)

  if (!user) {
    response.status(401).json({ message: 'Not authenticated.' })
    return
  }

  try {
    const input = parseKycInput(request.body)
    const submission = await submitKyc(user.id, input)

    response.status(201).json({ submission })
  } catch (error) {
    response.status(400).json({
      message: error instanceof Error ? error.message : 'Invalid KYC submission.',
    })
  }
})

app.get('/api/kyc/me', async (request, response) => {
  const user = await getSessionUser(request)

  if (!user) {
    response.status(401).json({ message: 'Not authenticated.' })
    return
  }

  try {
    const submission = await getLatestUserKyc(user.id)
    response.json({ submission })
  } catch (error) {
    response.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch KYC submission.',
    })
  }
})

app.get('/api/posts', async (_request, response) => {
  const posts = await listPublicPosts()

  response.json({ posts })
})

app.get('/api/me/posts', async (request, response) => {
  const user = await getSessionUser(request)

  if (!user) {
    response.status(401).json({ message: 'Not authenticated.' })
    return
  }

  const posts = await listUserPosts(user.id)

  response.json({ posts })
})

app.post('/api/posts', async (request, response) => {
  const user = await getSessionUser(request)

  if (!user) {
    response.status(401).json({ message: 'Not authenticated.' })
    return
  }

  if (user.status !== 'APPROVED') {
    response.status(403).json({ message: 'KYC must be approved before creating help or fundraising posts.' })
    return
  }

  try {
    const input = parsePostInput(request.body)
    const post = await createReliefPost(input, user)

    response.status(201).json({ post })
  } catch (error) {
    response.status(400).json({
      message: error instanceof Error ? error.message : 'Invalid post.',
    })
  }
})

app.get('/api/admin/kyc', requireSuperAdmin, async (_request, response) => {
  response.json({ submissions: await listKycSubmissions('PENDING') })
})

app.post('/api/admin/kyc/:id/review', requireSuperAdmin, async (request, response) => {
  try {
    const id = getRouteParam(request.params.id)
    const input = parseReviewInput(request.body)
    const adminId = (response.locals.user as { id: string }).id
    const submission = id ? await reviewKycSubmission(id, adminId, input.status, input.adminNotes) : null

    if (!submission) {
      response.status(404).json({ message: 'KYC submission not found.' })
      return
    }

    response.json({ submission })
  } catch (error) {
    response.status(400).json({ message: error instanceof Error ? error.message : 'Invalid review.' })
  }
})

app.get('/api/admin/posts', requireSuperAdmin, async (_request, response) => {
  response.json({ posts: await listReviewPosts() })
})

app.post('/api/admin/posts/:id/review', requireSuperAdmin, async (request, response) => {
  try {
    const id = getRouteParam(request.params.id)
    const input = parseReviewInput(request.body)
    const adminId = (response.locals.user as { id: string }).id
    const post = id ? await reviewPost(id, adminId, input.status, input.adminNotes) : null

    if (!post) {
      response.status(404).json({ message: 'Post not found.' })
      return
    }

    response.json({ post })
  } catch (error) {
    response.status(400).json({ message: error instanceof Error ? error.message : 'Invalid review.' })
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

app.post('/api/donations/initiate', initiatePayment)
app.post('/api/donations/verify', verifyPayment)
app.post('/api/pledges/material', createMaterialPledge)
app.post('/api/worker/pledges/complete', completeMaterialPledge)

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
