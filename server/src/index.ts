import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import authRouter from './routes/auth'
import tasksRouter from './routes/tasks'
import teamsRouter from './routes/teams'
import dashboardRouter from './routes/dashboard'

dotenv.config()

// Fail fast if required environment variables are missing
const REQUIRED_ENV_VARS = ['JWT_SECRET', 'DATABASE_URL'] as const
for (const envVar of REQUIRED_ENV_VARS) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

export const app = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
}))
app.use(express.json())

app.get('/health', (_, res) => res.json({ status: 'ok' }))
app.use('/auth', authRouter)
app.use('/api/tasks', tasksRouter)
app.use('/api/teams', teamsRouter)
app.use('/api/dashboard', dashboardRouter)

// Serve React frontend in production
const clientDist = path.join(__dirname, '../../client/dist')
app.use(express.static(clientDist))
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'))
})

if (require.main === module) {
  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}
