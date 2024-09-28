
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:4173", "https://chat-app-wft1.vercel.app", process.env.CLIENT_URL],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  useNewUrlParser: true, useUnifiedTopology: true
}

const TOKEN = 'token'


export {
  corsOptions,
  TOKEN
}