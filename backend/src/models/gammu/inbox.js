import { sequelize } from "../../config/database.js";
import { DataTypes } from "@sequelize/core";

const Inbox = sequelize.define("Inbox", {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: "ID",
  },
  UpdatedInDB: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: "UpdatedInDB",
    get() {
      const value = this.getDataValue('UpdatedInDB');
      return value ? new Date(value.toISOString().slice(0, 19).replace('T', ' ')) : null;
    }
  },
  ReceivingDateTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: "ReceivingDateTime",
  },
  Text: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: "Text",
  },
  SenderNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '',
    field: "SenderNumber",
  },
  Coding: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'Default_No_Compression',
    field: "Coding",
  },
  UDH: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: "UDH",
  },
  SMSCNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '',
    field: "SMSCNumber",
  },
  Class: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: -1,
    field: "Class",
  },
  TextDecoded: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    field: "TextDecoded",
  },
  RecipientID: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: "RecipientID",
  },
  Processed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: "Processed",
  },
  Status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: -1,
    field: "Status",
  },
}, {
  tableName: "inbox",
  timestamps: false,
  freezeTableName: true,
  indexes: [
    { fields: ["UpdatedInDB"] },
    { fields: ["ReceivingDateTime"] },
    { fields: ["SenderNumber"] },
  ],
});

export default Inbox;