import Sequelize from 'sequelize';
import sequelize from '../../utils/dbconnector';

const login = sequelize.define('tbllogin', {
    id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
    tenantid: { type: Sequelize.UUID, allowNull: false },
    firstname: { type: Sequelize.STRING, allowNull: false },
    lastname: { type: Sequelize.STRING, allowNull: false },
    profilepic: { type: Sequelize.STRING, allowNull: false },
    username: { type: Sequelize.STRING, validate: { isEmail: true }, allowNull: false },
    password: { type: Sequelize.STRING, allowNull: false },
    email_validation: { type: Sequelize.BOOLEAN, allowNull: false },
    otp: { type: Sequelize.INTEGER },
    otpdatetimestamp: { type: Sequelize.DATE },
    CreatedBy: { type: Sequelize.UUID, allowNull: true },
    UpdatedBy: { type: Sequelize.UUID, allowNull: true },
    sts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }
});

export default login;