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
//
import { exempleUtilisation } from "./test.js";
import { envoyerSMS, getHistoriqueEnvois, getSMSNonTraites, getStatistiquesModem, marquerCommeTraite } from "./test_gammu_pg.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app
  .use(morgan("dev"))
  .use(bodyParser.json())
  .use(
    cors({
      origin: process.env.CLIENT_URL,
      credentials: true,
    })
  )
  .use(bodyParser.urlencoded({ extended: true }));

app.use(express.json());

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

/**
 * 
 

const envoyer = await envoyerSMS("+261348143958", "Hello from ZeroNotify!");
const smsNonTraites = await getSMSNonTraites();
//marquerCommeTraite(8);
const historique = await getHistoriqueEnvois("+261348143958", 10);
const statistiques = await getStatistiquesModem();

console.log("SMS non traités", smsNonTraites);
console.log("historique", historique);
console.log("statistiques", statistiques);


//exempleUtilisation();

console.log(envoyer);

*/

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}/`);
});
