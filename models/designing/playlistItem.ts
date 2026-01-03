import Sequelize from 'sequelize';
import sequelize from '../../utils/dbconnector';

const playlistItem = sequelize.define('tblplaylistitem', {
    id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
    playlistId: { type: Sequelize.UUID, allowNull: false },
    designId: { type: Sequelize.UUID, allowNull: false },
    slno: { type: Sequelize.INTEGER, allowNull: false },
    duration: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 10 },
    CreatedBy: { type: Sequelize.UUID, allowNull: true },
    UpdatedBy: { type: Sequelize.UUID, allowNull: true },
    sts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }
});

export default playlistItem;