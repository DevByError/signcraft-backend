import Sequelize from 'sequelize';
import sequelize from '../../utils/dbconnector';

import login from './login';
import role from './role';

const userroleconfig = sequelize.define('tbluserroleconfig', {
    id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
    user_id: { type: Sequelize.UUID, allowNull: false },
    role_id: { type: Sequelize.UUID, allowNull: false },
    CreatedBy: { type: Sequelize.UUID, allowNull: true },
    UpdatedBy: { type: Sequelize.UUID, allowNull: true },
    sts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }
});

login.hasMany(userroleconfig, { foreignKey: 'user_id', onDelete: 'RESTRICT', onUpdate: 'RESTRICT' });
userroleconfig.belongsTo(login, { foreignKey: 'user_id' });

role.hasMany(userroleconfig, { foreignKey: 'role_id', onDelete: 'RESTRICT', onUpdate: 'RESTRICT' });
userroleconfig.belongsTo(role, { foreignKey: 'role_id' });

export default userroleconfig;