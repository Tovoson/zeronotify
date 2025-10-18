import { sequelize } from "../../config/database.js";
import { DataTypes } from "@sequelize/core";

const Outbox = sequelize.define("Outbox", {
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
  },
  InsertIntoDB: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: "InsertIntoDB",
  },
  SendingDateTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: "SendingDateTime",
  },
  SendBefore: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: '23:59:59',
    field: "SendBefore",
  },
  SendAfter: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: '00:00:00',
    field: "SendAfter",
  },
  Text: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: "Text",
  },
  DestinationNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '',
    field: "DestinationNumber",
  },
  Coding: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'Default_No_Compression',
    field: "Coding",
  },
  UDH: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: "UDH",
  },
  Class: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: -1,
    field: "Class",
  },
  TextDecoded: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
    field: "TextDecoded",
  },
  MultiPart: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: "MultiPart",
  },
  RelativeValidity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: -1,
    field: "RelativeValidity",
  },
  SenderID: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: "SenderID",
  },
  SendingTimeOut: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    field: "SendingTimeOut",
  },
  DeliveryReport: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: 'default',
    field: "DeliveryReport",
  },
  CreatorID: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: "CreatorID",
  },
  Retries: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: "Retries",
  },
  Priority: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    field: "Priority",
  },
  Status: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'Reserved',
    field: "Status",
  },
  StatusCode: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: -1,
    field: "StatusCode",
  },
}, {
  tableName: "outbox",
  timestamps: false,
  freezeTableName: true,
  indexes: [
    { fields: ["SendingDateTime"] },
    { fields: ["DestinationNumber"] },
    { fields: ["Status"] },
  ],
});

export default Outbox;