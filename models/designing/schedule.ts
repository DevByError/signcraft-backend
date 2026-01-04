import Sequelize from 'sequelize';
import sequelize from '../../utils/dbconnector';

const schedule = sequelize.define('tblschedule', {
    id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
    startTime: { type: Sequelize.DATE, allowNull: false },
    endTime: { type: Sequelize.DATE, allowNull: false },
    isImmediate: { type: Sequelize.BOOLEAN, defaultValue: false },
    priority: { type: Sequelize.INTEGER, defaultValue: 1 },
    sts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }
});

export default schedule;