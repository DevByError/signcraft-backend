import Sequelize from 'sequelize';
import sequelize from '../../utils/dbconnector';

import menu from './menu';
import role from './role';

const menuroleconfig = sequelize.define('tblmenuroleconfig', {
    id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
    menu_id: { type: Sequelize.UUID, allowNull: false },
    role_id: { type: Sequelize.UUID, allowNull: false },
    CreatedBy: { type: Sequelize.UUID, allowNull: true },
    UpdatedBy: { type: Sequelize.UUID, allowNull: true },
    sts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }
});

menu.hasMany(menuroleconfig, { foreignKey: 'menu_id', onDelete: 'RESTRICT', onUpdate: 'RESTRICT' });
menuroleconfig.belongsTo(menu, { foreignKey: 'menu_id' });

role.hasMany(menuroleconfig, { foreignKey: 'role_id', onDelete: 'RESTRICT', onUpdate: 'RESTRICT' });
menuroleconfig.belongsTo(role, { foreignKey: 'role_id' });

export default menuroleconfig;