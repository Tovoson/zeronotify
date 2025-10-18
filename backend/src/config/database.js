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

if (env !== "test") {
  testConnection();
}

export { sequelize };
export default sequelize;
