import { sequelize } from "../../config/database.js";
import { DataTypes } from "@sequelize/core";

const OutboxMultipart = sequelize.define("OutboxMultipart", {
  ID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    defaultValue: 0,
    field: "ID",
  },
  SequencePosition: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    defaultValue: 1,
    field: "SequencePosition",
  },
  Text: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: "Text",
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
    allowNull: true,
    defaultValue: null,
    field: "TextDecoded",
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
  tableName: "outbox_multipart",
  timestamps: false,
  freezeTableName: true,
});

export default OutboxMultipart;