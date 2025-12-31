import Sequelize from 'sequelize';
import sequelize from '../../utils/dbconnector';

const role = sequelize.define('tblrole', {
    id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
    rolename: { type: Sequelize.STRING, allowNull: false },
    CreatedBy: { type: Sequelize.UUID, allowNull: true },
    UpdatedBy: { type: Sequelize.UUID, allowNull: true },
    sts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }
});

export default role;