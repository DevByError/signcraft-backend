import Sequelize from 'sequelize';
import sequelize from '../../utils/dbconnector';
import login from '../management/login';

const design = sequelize.define('tbldesigns', {
    id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
    title: { type: Sequelize.STRING, allowNull: false },
    canvasData: { type: Sequelize.JSON, allowNull: false }, // Stores JSON elements
    timelineData: { type: Sequelize.JSON, allowNull: true }, // Stores CapCut partitions
    userId: { type: Sequelize.UUID, allowNull: false },
    CreatedBy: { type: Sequelize.UUID, allowNull: true },
    UpdatedBy: { type: Sequelize.UUID, allowNull: true },
    sts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }
});

export default design;
