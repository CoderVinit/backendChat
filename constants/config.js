
const corsOptions = {
  origin: ["https://chat-app-ten-ecru-78.vercel.app", "http://localhost:5173", process.env.CLIENT_URL],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}

const TOKEN = 'token'


export {
  corsOptions,
  TOKEN
}