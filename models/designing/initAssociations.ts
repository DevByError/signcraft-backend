import playlist from '../designing/playlist';
import playlistItem from '../designing/playlistItem';
import design from '../designing/design';
import login from '../management/login';
import screen from '../designing/screen';
import schedule from '../designing/schedule';

export const initAssociations = () => {
    console.log('🔗 Initializing Database Associations...');


    playlist.belongsTo(login, { foreignKey: 'userId', targetKey: 'id', onDelete: 'CASCADE' });
    login.hasMany(playlist, { foreignKey: 'userId', sourceKey: 'id' });


    playlist.hasMany(playlistItem, { foreignKey: 'playlistId', onDelete: 'CASCADE' });
    playlistItem.belongsTo(playlist, { foreignKey: 'playlistId' });


    design.hasMany(playlistItem, { foreignKey: 'designId', onDelete: 'RESTRICT' });
    playlistItem.belongsTo(design, { foreignKey: 'designId' });


    design.belongsTo(login, { foreignKey: 'userId' });
    login.hasMany(design, { foreignKey: 'userId' });



    screen.belongsTo(playlist, { foreignKey: 'playlistId' });
    playlist.hasMany(screen, { foreignKey: 'playlistId' });


    schedule.belongsTo(screen, { foreignKey: 'screenId', onDelete: 'CASCADE' });
    screen.hasMany(schedule, { foreignKey: 'screenId' });


    schedule.belongsTo(playlist, { foreignKey: 'playlistId', onDelete: 'CASCADE' });
    playlist.hasMany(schedule, { foreignKey: 'playlistId' });

    console.log('✅ Database Associations Setup Complete.');
};