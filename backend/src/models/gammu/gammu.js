import { sequelize } from "../../config/database.js";
import { DataTypes } from "@sequelize/core";

const Gammu = sequelize.define("Gammu", {
  Version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 17,
    field: "Version", // Forcer le nom exact de la colonne
  },
}, {
  tableName: "gammu",
  timestamps: false,
  freezeTableName: true,
});

export default Gammu;