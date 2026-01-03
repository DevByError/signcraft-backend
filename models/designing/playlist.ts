import Sequelize from 'sequelize';
import sequelize from '../../utils/dbconnector';

const playlist = sequelize.define('tblplaylist', {
    id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
    name: { type: Sequelize.STRING, allowNull: false },
    description: { type: Sequelize.STRING, allowNull: true },
    userId: { type: Sequelize.UUID, allowNull: false },
    CreatedBy: { type: Sequelize.UUID, allowNull: true },
    UpdatedBy: { type: Sequelize.UUID, allowNull: true },
    sts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }
});

export default playlist;