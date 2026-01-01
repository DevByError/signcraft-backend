import Sequelize from 'sequelize';
import sequelize from '../../utils/dbconnector';

const design = sequelize.define('tbldesigns', {
    id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
    title: { type: Sequelize.STRING, allowNull: false },
    canvasData: { type: Sequelize.JSON, allowNull: false }, // Stores your Konva JSON elements
    timelineData: { type: Sequelize.JSON, allowNull: true }, // Stores CapCut partitions
    userId: { type: Sequelize.UUID, allowNull: false },
    videoUrl: { type: Sequelize.STRING, allowNull: true }, // AWS S3 URL
    videoSize: { type: Sequelize.STRING, allowNull: true }, // e.g. "2.4MB"
    CreatedBy: { type: Sequelize.UUID, allowNull: true },
    UpdatedBy: { type: Sequelize.UUID, allowNull: true },
    sts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }
});

export default design;
