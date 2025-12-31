import Sequelize from 'sequelize';
import sequelize from '../../utils/dbconnector';

const profile = sequelize.define('tblprofile', {
    id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
    tenantid: { type: Sequelize.UUID, allowNull: true },
    tenantname: { type: Sequelize.STRING, allowNull: false },
    logo: { type: Sequelize.STRING, allowNull: false },
    favicon: { type: Sequelize.STRING, allowNull: false },
    systemicon: { type: Sequelize.STRING, allowNull: false },
    tenantsname: { type: Sequelize.STRING, allowNull: false },
    cprighttxt: { type: Sequelize.STRING, allowNull: false },
    cprighturl: { type: Sequelize.STRING, allowNull: false },
    href: { type: Sequelize.STRING, allowNull: false },
    CreatedBy: { type: Sequelize.UUID, allowNull: true },
    UpdatedBy: { type: Sequelize.UUID, allowNull: true },
    sts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }
});

export default profile;