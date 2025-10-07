import { Sequelize } from "@sequelize/core";
import dotenv from "dotenv";

dotenv.config();

const env = process.env.NODE_ENV || "development";
const isDocker =
  process.env.DOCKER === "false" || process.env.IS_DOCKER === "true";

const config = {
  development: {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: isDocker ? process.env.DB_HOST || "postgres" : "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
  },
  // test: {
  //   user: process.env.DB_USER || "admin",
  //   password: process.env.DB_PASSWORD || "admin",
  //   database: process.env.DB_NAME || "zeronotify_db",
  //   host: isDocker ? process.env.DB_HOST || "postgres" : "127.0.0.1",
  //   port: process.env.DB_PORT || 5432,
  //   dialect: "postgres"
  // },
  // production: {
  //   username: process.env.DB_USER || "admin",
  //   password: process.env.DB_PASSWORD || "admin",
  //   database: process.env.DB_NAME || "zeronotify_db",
  //   host: isDocker ? process.env.DB_HOST || "postgres" : "127.0.0.1",
  //   port: process.env.DB_PORT || 5432,
  //   dialect: "postgres"
  // }
};

const sequelize = new Sequelize(config[env]);

const testConnection = () =>
  sequelize
    .authenticate()
    .then(() =>
      console.log(
        `✅ Connection to ${env} database has been established successfully.`
      )
    )
    .catch((error) =>
      console.error(`❌ Unable to connect to the ${env} database:`, error)
    );

const initDb = async () => {
  try {
    const _ = await sequelize.sync({ force: false });

    console.log("La base de données Sms a été migrée avec succès.");
  } catch (error) {
    return console.log(`erreur de migration : ${error}`);
  }
};

if (env !== "test") {
  testConnection();
  initDb();
}

export { sequelize };
export default sequelize;
