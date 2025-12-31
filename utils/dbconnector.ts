import { Sequelize } from "sequelize";

export const sequelize = new Sequelize(
    process.env.dbname as string,
    process.env.dbusername as string,
    process.env.dbpassword,
    {
        host: process.env.dbhost,
        port: Number(process.env.dbport),
        dialect: process.env.dialect as any,
        logging: false,
        dialectOptions: {
            connectTimeout: 60000,
        },
    }
);

export default sequelize;