import Sequelize from 'sequelize';
import sequelize from '../../utils/dbconnector';

import route from './route';
import role from './role';

const routeroleconfig = sequelize.define('tblrouteroleconfig', {
    id: { type: Sequelize.UUID, allowNull: false, primaryKey: true },
    route_id: { type: Sequelize.UUID, allowNull: false },
    role_id: { type: Sequelize.UUID, allowNull: false },
    CreatedBy: { type: Sequelize.UUID, allowNull: true },
    UpdatedBy: { type: Sequelize.UUID, allowNull: true },
    sts: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }
});

route.hasMany(routeroleconfig, { foreignKey: 'route_id', onDelete: 'RESTRICT', onUpdate: 'RESTRICT' });
routeroleconfig.belongsTo(route, { foreignKey: 'route_id' });

role.hasMany(routeroleconfig, { foreignKey: 'role_id', onDelete: 'RESTRICT', onUpdate: 'RESTRICT' });
routeroleconfig.belongsTo(role, { foreignKey: 'role_id' });

export default routeroleconfig;