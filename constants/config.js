
const corsOptions = {
  origin: ["*", process.env.CLIENT_URL],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  useNewUrlParser: true, useUnifiedTopology: true
}

const TOKEN = 'token'


export {
  corsOptions,
  TOKEN
}