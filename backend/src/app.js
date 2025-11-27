import express from "express";
import authRouter from "./routes/auth.routes.js";
import smsRouter from "./routes/sms.route.js";
import dotenv from "dotenv";
import morgan from "morgan";
import bodyParser from "body-parser";
import cors from "cors";
import syncDatabase from "./config/syncDatabase.js";
import contactRouter from "./routes/contact.routes.js";
import templateRouter from "./routes/template.routes.js";
import "./outils/scheduledSmsService.js";
import "./outils/scheduledSendSmsTemplate.js"
import http from 'http';
import { Server } from 'socket.io';
import {demarrerWorker} from "./services/smsWorker.js"
import swaggerJSDoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { fileURLToPath } from 'url';
import path from 'path';


dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
process.env.TZ = 'Indian/Antananarivo';

const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const corsOptions = {
    origin: 'http://localhost:5173', // <-- Autorisez l'origine de votre frontend React
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Autorise les cookies et les en-têtes d'authentification
    optionsSuccessStatus: 204 // Pour gérer les requêtes preflight (OPTIONS)
};

app
  .use(morgan("dev"))
  .use(bodyParser.json())
  .use(
    cors(corsOptions)
  )
  .use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ZeroNotify Api',
      version: '1.0.0'
    },
    servers: [
      {
        url: 'http://localhost:3000/'
      }
    ]
  },
  apis: [
    path.join(__dirname, 'app.js'),
    path.join(__dirname, 'controllers/*.js')
  ]
}

const swaggerSpec = swaggerJSDoc(options)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
console.log('Paths trouvés:', swaggerSpec.paths)
//teste();

/**
 * @swagger
 * /:
 *   get:
 *     summary: This api is used to check if Get method is working or not
 *     description: api en marche
 *     responses:
 *       200:
 *         description: To test Get method
 */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "APIs en marche",
  });
});

await syncDatabase();

// Sample routes
app.use("/zeronotify/auth", authRouter);
app.use("/zeronotify/sms", smsRouter);
app.use("/zeronotify/contact", contactRouter);
app.use("/zeronotify/template", templateRouter);

app.use((req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: "Route inexistante",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}/`);
  demarrerWorker();
});
