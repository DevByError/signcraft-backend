import Sequelize from 'sequelize';
import sequelize from '../../utils/dbconnector';

const route = sequelize.define('tblroute', {
    id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
    route: { type: Sequelize.STRING, allowNull: false },
    method: { type: Sequelize.STRING, allowNull: false },
    CreatedBy: { type: Sequelize.UUID, allowNull: true },
    UpdatedBy: { type: Sequelize.UUID, allowNull: true },
    sts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }
});

export default route;