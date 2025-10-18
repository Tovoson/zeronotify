import { sequelize } from "../../config/database.js";
import { DataTypes } from "@sequelize/core";

const Phones = sequelize.define("Phones", {
  IMEI: {
    type: DataTypes.STRING(35),
    primaryKey: true,
    allowNull: false,
    field: "IMEI",
  },
  ID: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: "ID",
  },
  UpdatedInDB: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: "UpdatedInDB",
  },
  InsertIntoDB: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: "InsertIntoDB",
  },
  TimeOut: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: "TimeOut",
  },
  Send: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: "Send",
  },
  Receive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: "Receive",
  },
  IMSI: {
    type: DataTypes.STRING(35),
    allowNull: false,
    field: "IMSI",
  },
  NetCode: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: 'ERROR',
    field: "NetCode",
  },
  NetName: {
    type: DataTypes.STRING(35),
    allowNull: true,
    defaultValue: 'ERROR',
    field: "NetName",
  },
  Client: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: "Client",
  },
  Battery: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: -1,
    field: "Battery",
  },
  Signal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: -1,
    field: "Signal",
  },
  Sent: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: "Sent",
  },
  Received: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: "Received",
  },
}, {
  tableName: "phones",
  timestamps: false,
  freezeTableName: true,
});

export default Phones;