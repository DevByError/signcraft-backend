import playlist from '../designing/playlist';
import playlistItem from '../designing/playlistItem';
import design from '../designing/design';
import login from '../management/login';
// ✅ Import the new models
import screen from '../designing/screen';
import schedule from '../designing/schedule';

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

    // --- Design <-> User ---
    design.belongsTo(login, { foreignKey: 'userId' });
    login.hasMany(design, { foreignKey: 'userId' });

    // =========================================================
    // 🚀 NEW ASSOCIATIONS FOR SCREEN MANAGEMENT & SCHEDULING
    // =========================================================

    // --- Screen <-> Playlist (The "Default" or "Current" Playlist) ---
    screen.belongsTo(playlist, { foreignKey: 'playlistId' });
    playlist.hasMany(screen, { foreignKey: 'playlistId' });

    // --- Schedule <-> Screen (One screen has many scheduled slots) ---
    schedule.belongsTo(screen, { foreignKey: 'screenId', onDelete: 'CASCADE' });
    screen.hasMany(schedule, { foreignKey: 'screenId' });

    // --- Schedule <-> Playlist (What content plays during that slot) ---
    schedule.belongsTo(playlist, { foreignKey: 'playlistId', onDelete: 'CASCADE' });
    playlist.hasMany(schedule, { foreignKey: 'playlistId' });

    console.log('✅ Database Associations Setup Complete.');
};