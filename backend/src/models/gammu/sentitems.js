import { sequelize } from "../../config/database.js";
import { DataTypes } from "@sequelize/core";

const SentItems = sequelize.define("SentItems", {
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
  DeliveryDateTime: {
    type: DataTypes.DATE,
    allowNull: true,
    field: "DeliveryDateTime",
  },
  Text: {
    type: DataTypes.TEXT,
    allowNull: false,
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
  SenderID: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: "SenderID",
  },
  SequencePosition: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: "SequencePosition",
  },
  Status: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'SendingOK',
    field: "Status",
  },
  StatusError: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: -1,
    field: "StatusError",
  },
  TPMR: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: -1,
    field: "TPMR",
  },
  RelativeValidity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: -1,
    field: "RelativeValidity",
  },
  CreatorID: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: "CreatorID",
  },
  StatusCode: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: -1,
    field: "StatusCode",
  },
}, {
  tableName: "sentitems",
  timestamps: false,
  freezeTableName: true,
  indexes: [
    { fields: ["SendingDateTime"] },
    { fields: ["DestinationNumber"] },
    { fields: ["Status"] },
  ],
});

export default SentItems;