import Sequelize from 'sequelize';
import sequelize from '../../utils/dbconnector';
import playlist from './playlist';
import design from './design';

const playlistItem = sequelize.define('tblplaylistitem', {
    id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
    playlistId: { type: Sequelize.UUID, allowNull: false },
    designId: { type: Sequelize.UUID, allowNull: false },
    slno: { type: Sequelize.INTEGER, allowNull: false }, // The order in the slideshow
    duration: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5 }, // Seconds per slide
    CreatedBy: { type: Sequelize.UUID, allowNull: true },
    UpdatedBy: { type: Sequelize.UUID, allowNull: true },
    sts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }
});

// Relationships
playlist.hasMany(playlistItem, { foreignKey: 'playlistId', onDelete: 'CASCADE' });
playlistItem.belongsTo(playlist, { foreignKey: 'playlistId' });

design.hasMany(playlistItem, { foreignKey: 'designId', onDelete: 'RESTRICT' });
playlistItem.belongsTo(design, { foreignKey: 'designId' });

export default playlistItem;