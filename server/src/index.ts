import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

dotenv.config()

const app = express()
const port = Number(process.env.PORT) || 5000

app.use(cors())
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'UddharSetu API',
  })
})

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})
