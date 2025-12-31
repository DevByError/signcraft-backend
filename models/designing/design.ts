import Sequelize from 'sequelize';
import sequelize from '../../utils/dbconnector';

const design = sequelize.define('tbldesign', {
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

// import { DataTypes, Model, UUIDV4 } from 'sequelize';
// import type { Optional } from 'sequelize';
// import sequelize from '../../utils/dbconnector';

// /* ===============================
//    1️⃣ Attributes Interface
// ================================ */

// export interface DesignAttributes {
//     id: string;
//     title: string;
//     canvasData: Record<string, any>;
//     timelineData?: Record<string, any> | null;
//     userId: string;
//     videoUrl?: string | null;
//     videoSize?: string | null;
//     CreatedBy?: string | null;
//     UpdatedBy?: string | null;
//     sts: boolean;
// }

// /* ===============================
//    2️⃣ Creation Attributes
// ================================ */

// export interface DesignCreationAttributes
//     extends Optional<
//         DesignAttributes,
//         | 'id'
//         | 'timelineData'
//         | 'videoUrl'
//         | 'videoSize'
//         | 'CreatedBy'
//         | 'UpdatedBy'
//         | 'sts'
//     > { }

// /* ===============================
//    3️⃣ Model Class
// ================================ */

// class Design
//     extends Model<DesignAttributes, DesignCreationAttributes>
//     implements DesignAttributes {
//     public id!: string;
//     public title!: string;
//     public canvasData!: Record<string, any>;
//     public timelineData!: Record<string, any> | null;
//     public userId!: string;
//     public videoUrl!: string | null;
//     public videoSize!: string | null;
//     public CreatedBy!: string | null;
//     public UpdatedBy!: string | null;
//     public sts!: boolean;

//     // timestamps
//     public readonly createdAt!: Date;
//     public readonly updatedAt!: Date;
// }

// /* ===============================
//    4️⃣ Init Model
// ================================ */

// Design.init(
//     {
//         id: {
//             type: DataTypes.UUID,
//             defaultValue: UUIDV4,
//             allowNull: false,
//             primaryKey: true,
//         },
//         title: {
//             type: DataTypes.STRING,
//             allowNull: false,
//         },
//         canvasData: {
//             type: DataTypes.JSON,
//             allowNull: false,
//         },
//         timelineData: {
//             type: DataTypes.JSON,
//             allowNull: true,
//         },
//         userId: {
//             type: DataTypes.UUID,
//             allowNull: false,
//         },
//         videoUrl: {
//             type: DataTypes.STRING,
//             allowNull: true,
//         },
//         videoSize: {
//             type: DataTypes.STRING,
//             allowNull: true,
//         },
//         CreatedBy: {
//             type: DataTypes.UUID,
//             allowNull: true,
//         },
//         UpdatedBy: {
//             type: DataTypes.UUID,
//             allowNull: true,
//         },
//         sts: {
//             type: DataTypes.BOOLEAN,
//             allowNull: false,
//             defaultValue: true,
//         },
//     },
//     {
//         sequelize,
//         tableName: 'tbldesigns',
//         modelName: 'Design',
//         timestamps: true,
//     }
// );

// export default Design;
