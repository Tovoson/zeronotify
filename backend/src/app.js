import express from "express";
import authRouter from "./routes/auth.routes.js";
import smsRouter from "./routes/sms.route.js";
import dotenv from "dotenv";
import morgan from "morgan";
import bodyParser from "body-parser";
import cors from "cors";
import syncDatabase from "./config/syncDatabase.js";
import contactRouter from "./routes/contact.routes.js";
import { exempleUtilisation } from "./test.js";

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

app.use((req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: "Route inexistante",
  });
});

//exempleUtilisation();

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}/`);
});
