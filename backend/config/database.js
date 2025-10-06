import sequelize from 'sequelize';
import config from '/config.json';

const env = process.env.NODE_ENV || 'development';
const sequelize = new sequelize(config[env])

export { sequelize };
export default sequelize;