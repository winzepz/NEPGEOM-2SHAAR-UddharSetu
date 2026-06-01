import crypto from 'node:crypto'
import type { Request, Response } from 'express'
import { db } from './db.js'
import {
  parseString,
  parsePositiveInteger,
  parsePositiveNumber,
  parseOptionalString,
} from './validation.js'

type PledgeRow = {
  id: string
  post_id: string
  pledge_type: 'FINANCIAL' | 'MATERIAL'
  amount: string | null
  quantity: number | null
  donor_name: string | null
  donor_phone: string
  secure_token: string
  status: 'PLEDGED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED'
  created_at: Date
  updated_at: Date
}

function generatePledgeToken(): string {
  return 'US-' + crypto.randomBytes(3).toString('hex').toUpperCase()
}

// Initiate Khalti Payment
export async function initiatePayment(request: Request, response: Response) {
  try {
    const { postId, amount, donorPhone, donorName } = request.body

    const parsedPostId = parseString(postId, 'postId')
    const parsedAmount = parsePositiveNumber(amount, 'amount')
    const parsedPhone = parseString(donorPhone, 'donorPhone')
    const parsedName = parseOptionalString(donorName) || 'Anonymous Donor'

    // Fetch relief post and ensure it exists and is fundraising
    const postQuery = await db.query(
      `select id, title, target_amount, fulfilled_amount from relief_posts where id = $1`,
      [parsedPostId]
    )
    const post = postQuery.rows[0]
    if (!post) {
      response.status(404).json({ message: 'Relief post not found.' })
      return
    }

    // Generate a temporary pledge record in the database
    const pledgeId = crypto.randomUUID()
    const tempToken = 'TEMP-' + crypto.randomUUID()

    await db.query(
      `
        insert into relief_pledges (id, post_id, pledge_type, amount, donor_name, donor_phone, secure_token, status)
        values ($1, $2, 'FINANCIAL', $3, $4, $5, $6, 'PLEDGED')
      `,
      [pledgeId, parsedPostId, parsedAmount, parsedName, parsedPhone, tempToken]
    )

    // Khalti integration parameters
    const khaltiSecretKey = process.env.KHALTI_SECRET_KEY
    if (!khaltiSecretKey) throw new Error('Khalti secret key is not configured.')
    const amountInPaisa = Math.round(parsedAmount * 100)

    const siteUrl = process.env.CLIENT_BASE_URL || 'http://localhost:5175'
    const returnUrl = `${siteUrl}/`

    const khaltiBody = {
      return_url: returnUrl,
      website_url: siteUrl,
      amount: amountInPaisa,
      purchase_order_id: pledgeId,
      purchase_order_name: `Donation: ${post.title.substring(0, 30)}`,
      customer_info: {
        name: parsedName,
        email: 'donor@uddharsetu.org',
        phone: parsedPhone.substring(0, 10),
      },
    }

    const khaltiResponse = await fetch('https://a.khalti.com/api/v2/epayment/initiate/', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${khaltiSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(khaltiBody),
    })

    const khaltiData = await khaltiResponse.json() as { pidx?: string; payment_url?: string; detail?: string }

    if (!khaltiResponse.ok || !khaltiData.pidx || !khaltiData.payment_url) {
      console.error('Khalti initiate failed:', khaltiData)
      throw new Error(khaltiData.detail || 'Failed to initiate payment with Khalti.')
    }

    // Update pledge secure_token with the pidx
    await db.query(
      `update relief_pledges set secure_token = $1 where id = $2`,
      [khaltiData.pidx, pledgeId]
    )

    response.json({
      paymentUrl: khaltiData.payment_url,
      pidx: khaltiData.pidx,
      pledgeId,
    })
  } catch (error) {
    response.status(400).json({
      message: error instanceof Error ? error.message : 'Could not initiate donation payment.',
    })
  }
}

// Verify Khalti Payment (Lookup & Update inside isolated transaction)
export async function verifyPayment(request: Request, response: Response) {
  try {
    const { pidx } = request.body
    const parsedPidx = parseString(pidx, 'pidx')

    // Find the pledge by pidx (stored in secure_token)
    const pledgeQuery = await db.query<PledgeRow>(
      `select * from relief_pledges where secure_token = $1`,
      [parsedPidx]
    )
    const pledge = pledgeQuery.rows[0]
    if (!pledge) {
      response.status(404).json({ message: 'Donation pledge not found.' })
      return
    }

    if (pledge.status === 'COMPLETED') {
      response.json({ message: 'Payment already completed successfully.', pledge })
      return
    }

    const khaltiSecretKey = process.env.KHALTI_SECRET_KEY
    if (!khaltiSecretKey) throw new Error('Khalti secret key is not configured.')

    const khaltiResponse = await fetch('https://a.khalti.com/api/v2/epayment/lookup/', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${khaltiSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pidx: parsedPidx }),
    })

    const khaltiData = await khaltiResponse.json() as {
      pidx?: string
      status?: string
      transaction_id?: string
      total_amount?: number  // paisa
    }

    if (!khaltiResponse.ok || khaltiData.status !== 'Completed') {
      response.status(400).json({ message: 'Payment verification failed or is not completed.' })
      return
    }

    // Use Khalti-confirmed amount (paisa → NPR) so we credit exactly what was charged
    const confirmedAmountNPR = khaltiData.total_amount != null
      ? khaltiData.total_amount / 100
      : (pledge.amount ? Number(pledge.amount) : 0)

    // Run PostgreSQL transaction with row-level locking
    await db.query('BEGIN')
    try {
      // 1. Lock the relief post row
      const postQuery = await db.query(
        `select id, title, fulfilled_amount from relief_posts where id = $1 for update`,
        [pledge.post_id]
      )
      const post = postQuery.rows[0]
      if (!post) {
        throw new Error('Associated relief post not found.')
      }

      // Re-verify pledge state inside transaction to prevent double-credit
      const lockPledgeQuery = await db.query(
        `select status from relief_pledges where id = $1 for update`,
        [pledge.id]
      )
      if (lockPledgeQuery.rows[0]?.status === 'COMPLETED') {
        await db.query('COMMIT')
        response.json({
          message: 'Payment already completed successfully.',
          status: 'Completed',
          campaignTitle: post.title,
          amountNPR: confirmedAmountNPR,
        })
        return
      }

      // 2. Update pledge: mark completed, store confirmed amount
      await db.query(
        `update relief_pledges set status = 'COMPLETED', amount = $1, updated_at = now() where id = $2`,
        [confirmedAmountNPR, pledge.id]
      )

      // 3. Add confirmed amount to the relief post
      await db.query(
        `update relief_posts set fulfilled_amount = fulfilled_amount + $1, updated_at = now() where id = $2`,
        [confirmedAmountNPR, pledge.post_id]
      )

      await db.query('COMMIT')
      response.json({
        message: 'Payment verified and credited successfully.',
        status: 'Completed',
        campaignTitle: post.title,
        amountNPR: confirmedAmountNPR,
      })
    } catch (transactionError) {
      await db.query('ROLLBACK')
      throw transactionError
    }
  } catch (error) {
    response.status(400).json({
      message: error instanceof Error ? error.message : 'Verification failed.',
    })
  }
}

// Create Material Pledge
export async function createMaterialPledge(request: Request, response: Response) {
  try {
    const { postId, quantity, donorPhone, donorName } = request.body

    const parsedPostId = parseString(postId, 'postId')
    const parsedQuantity = parsePositiveInteger(quantity, 'quantity')
    const parsedPhone = parseString(donorPhone, 'donorPhone')
    const parsedName = parseOptionalString(donorName) || 'Anonymous Donor'

    await db.query('BEGIN')
    try {
      const postQuery = await db.query(
        `select id, target_quantity, fulfilled_quantity from relief_posts where id = $1 for update`,
        [parsedPostId]
      )
      const post = postQuery.rows[0]
      if (!post) {
        throw new Error('Relief post not found.')
      }

      if (!post.target_quantity) {
        throw new Error('Selected relief post does not accept quantity pledges.')
      }

      const remaining = post.target_quantity - post.fulfilled_quantity

      if (parsedQuantity > remaining) {
        throw new Error(`Insufficient capacity. Only ${remaining > 0 ? remaining : 0} items remaining to be pledged.`)
      }

      const secureToken = generatePledgeToken()
      const pledgeId = crypto.randomUUID()

      const insertResult = await db.query<PledgeRow>(
        `
          insert into relief_pledges (id, post_id, pledge_type, quantity, donor_name, donor_phone, secure_token, status)
          values ($1, $2, 'MATERIAL', $3, $4, $5, $6, 'COMPLETED')
          returning *
        `,
        [pledgeId, parsedPostId, parsedQuantity, parsedName, parsedPhone, secureToken]
      )

      await db.query(
        `update relief_posts set fulfilled_quantity = fulfilled_quantity + $1, updated_at = now() where id = $2`,
        [parsedQuantity, parsedPostId]
      )

      await db.query('COMMIT')

      response.status(201).json({
        message: 'Material support pledged successfully.',
        pledge: insertResult.rows[0],
      })
    } catch (transactionError) {
      await db.query('ROLLBACK')
      throw transactionError
    }
  } catch (error) {
    response.status(400).json({
      message: error instanceof Error ? error.message : 'Could not create material pledge.',
    })
  }
}

