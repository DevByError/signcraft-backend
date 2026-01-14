// import Sequelize from 'sequelize';
// import sequelize from '../../utils/dbconnector';

// const schedule = sequelize.define('tblschedule', {
//     id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
//     startTime: { type: Sequelize.DATE, allowNull: false },
//     endTime: { type: Sequelize.DATE, allowNull: false },
//     isImmediate: { type: Sequelize.BOOLEAN, defaultValue: false },
//     priority: { type: Sequelize.INTEGER, defaultValue: 1 },
//     sts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }
// });

// export default schedule;

// import Sequelize from 'sequelize';
// import sequelize from '../../utils/dbconnector';

// const schedule = sequelize.define('tblschedule', {
//     id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
//     screenId: { type: Sequelize.UUID, allowNull: false },
//     playlistId: { type: Sequelize.UUID, allowNull: false },
//     videoUrl: { type: Sequelize.STRING, allowNull: true }, // NEW: Store the S3 link here
//     width: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 1920 },
//     height: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 1080 },
//     startTime: { type: Sequelize.DATE, allowNull: false },
//     endTime: { type: Sequelize.DATE, allowNull: false },
//     isImmediate: { type: Sequelize.BOOLEAN, defaultValue: false },
//     priority: { type: Sequelize.INTEGER, defaultValue: 1 },
//     sts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }
// });

// export default schedule;

import Sequelize from 'sequelize';
import sequelize from '../../utils/dbconnector';

const schedule = sequelize.define('tblschedule', {
    id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        autoIncrement: false // Explicitly tell it NOT to look for max()
    },
    screenId: { type: Sequelize.UUID, allowNull: false },
    playlistId: { type: Sequelize.UUID, allowNull: false },
    videoUrl: { type: Sequelize.STRING, allowNull: true },

    // Dimensions from the design
    width: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 1920 },
    height: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 1080 },

    startTime: { type: Sequelize.DATE, allowNull: false },
    endTime: { type: Sequelize.DATE, allowNull: false },
    isImmediate: { type: Sequelize.BOOLEAN, defaultValue: false },
    sts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }
}, {
    tableName: 'tblschedules',
    timestamps: true
});

export default schedule;