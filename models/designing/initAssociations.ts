import playlist from '../designing/playlist';
import playlistItem from '../designing/playlistItem';
import design from '../designing/design';
import login from '../management/login';

export const initAssociations = () => {
    console.log('🔗 Initializing Database Associations...');

    // --- Playlist <-> User ---
    playlist.belongsTo(login, { foreignKey: 'userId', targetKey: 'id', onDelete: 'CASCADE' });
    login.hasMany(playlist, { foreignKey: 'userId', sourceKey: 'id' });

    // --- Playlist <-> Playlist Items ---
    playlist.hasMany(playlistItem, { foreignKey: 'playlistId', onDelete: 'CASCADE' });
    playlistItem.belongsTo(playlist, { foreignKey: 'playlistId' });

    // --- Playlist Items <-> Design ---
    design.hasMany(playlistItem, { foreignKey: 'designId', onDelete: 'RESTRICT' });
    playlistItem.belongsTo(design, { foreignKey: 'designId' });

    // --- Design <-> User (If you haven't defined it elsewhere) ---
    design.belongsTo(login, { foreignKey: 'userId' });
    login.hasMany(design, { foreignKey: 'userId' });

    console.log('✅ Database Associations Setup Complete.');
};