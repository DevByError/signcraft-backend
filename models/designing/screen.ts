import Sequelize from 'sequelize';
import sequelize from '../../utils/dbconnector';
import playlist from '../designing/playlist';

const screen = sequelize.define('tblscreen', {
    id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
    screenName: { type: Sequelize.STRING, allowNull: false },
    screenLocation: { type: Sequelize.STRING, allowNull: true },
    // screenCustomId is the ID you type in the Android App to connect
    screenCustomId: { type: Sequelize.STRING, allowNull: false, unique: true },
    playlistId: { type: Sequelize.UUID, allowNull: true }, // The playlist currently assigned
    lastSync: { type: Sequelize.DATE, allowNull: true },
    CreatedBy: { type: Sequelize.UUID, allowNull: true },
    UpdatedBy: { type: Sequelize.UUID, allowNull: true },
    sts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }
});

// Relationship: A screen has one playlist
// screen.belongsTo(playlist, { foreignKey: 'playlistId' });
// playlist.hasMany(screen, { foreignKey: 'playlistId' });

export default screen;