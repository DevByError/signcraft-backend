import Sequelize from 'sequelize';
import sequelize from '../../utils/dbconnector';

const menu = sequelize.define('tblmenu', {
    id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
    parent_id: { type: Sequelize.UUID, allowNull: true },
    slno: { type: Sequelize.INTEGER, allowNull: false },
    menuname: { type: Sequelize.STRING, allowNull: false },
    iclass: { type: Sequelize.STRING, allowNull: false },
    menuclass: { type: Sequelize.STRING, allowNull: false },
    href: { type: Sequelize.STRING, allowNull: false },
    CreatedBy: { type: Sequelize.UUID, allowNull: true },
    UpdatedBy: { type: Sequelize.UUID, allowNull: true },
    sts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }
});

export default menu;