import Sequelize from 'sequelize';
import sequelize from '../../utils/dbconnector';
import login from '../management/login';

const design = sequelize.define('tbldesigns', {
    id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
    title: { type: Sequelize.STRING, allowNull: false },
    canvasData: { type: Sequelize.JSON, allowNull: false }, // Stores JSON elements
    timelineData: { type: Sequelize.JSON, allowNull: true }, // Stores CapCut partitions
    userId: { type: Sequelize.UUID, allowNull: false },
    // videoUrl: { type: Sequelize.STRING, allowNull: true }, // AWS S3 URL,,, but we are no longer useing them
    // videoSize: { type: Sequelize.STRING, allowNull: true }, // we are no longer using them 
    CreatedBy: { type: Sequelize.UUID, allowNull: true },
    UpdatedBy: { type: Sequelize.UUID, allowNull: true },
    sts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }
});

// login.hasMany(design, {
//     foreignKey: 'userId',
//     onDelete: 'CASCADE',
//     onUpdate: 'CASCADE',
// });


// design.belongsTo(login, {
//     foreignKey: 'userId',
// });

export default design;
