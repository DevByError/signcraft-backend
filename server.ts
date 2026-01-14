

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { config } from 'dotenv';
import sequelize from './utils/dbconnector';
import cors from 'cors';
import path from 'path';
import { Op } from 'sequelize';
import { initAssociations } from './models/designing/initAssociations';





dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*" }
});

app.set('socketio', io);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));

import './models/management/login';
import './models/management/role';
import './models/management/menu';
import './models/management/route';
import './models/management/menuroleconfig';
import './models/management/routeroleconfig';
import './models/management/userroleconfig';
import './models/management/profile';
import './models/designing/design';
import './models/designing/playlist';
import './models/designing/playlistItem';
import screen from './models/designing/screen';
import './models/designing/schedule';

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(cookieParser());

import designingRoutes from './routes/designingRoute';
import accountsRoute from './routes/accountsRoute';
import errorsRoute from './routes/errorsRoute';
import generalRoute from './routes/generalRoute';

app.use('/design', designingRoutes);
app.use('/accounts', accountsRoute);
app.use('/errors', errorsRoute);
app.use('/general', generalRoute);
app.use('/', accountsRoute);

// Initialize Relationships
initAssociations();

io.on('connection', (socket) => {
    console.log(`🔌 New Connection: ${socket.id}`);

    // ANDROID: Register Screen
    socket.on('register_screen', async (data: { screenUUID: string }) => {
        const { screenUUID } = data;
        console.log(`📱 Device attempting to register as: ${screenUUID}`);

        try {
            const foundScreen = await screen.findOne({
                where: {
                    sts: true,
                    [Op.or]: [
                        { screenCustomId: screenUUID },
                        { id: screenUUID }
                    ]
                }
            });

            if (foundScreen) {
                const screenData = foundScreen as any;
                const longID = screenData.id;

                // 1. Join the Room (using the DB UUID)
                socket.join(longID);

                // 2. Log success
                console.log(`✅ Screen Verified: ${screenData.screenName} | Room: ${longID}`);

                // 3. Tell the App it is successful
                socket.emit('registration_success', {
                    screenId: longID,
                    name: screenData.screenName
                });

                // 4. Notify Web Dashboard that a screen status changed
                io.emit('screen_status_changed', { screenId: longID, status: 'online' });

            } else {
                console.log(`❌ Invalid Screen ID: ${screenUUID}`);
                socket.emit('registration_failed', { msg: 'Screen ID not found' });
            }
        } catch (err) {
            console.error("Socket DB Error:", err);
            socket.emit('registration_failed', { msg: 'Server Database Error' });
        }
    });

    socket.on('join_dashboard', () => {
        console.log(`💻 Web Dashboard Connected: ${socket.id}`);
    });

    socket.on('disconnecting', () => {
        // Find which screen rooms this socket was in before it leaves
        socket.rooms.forEach(room => {
            if (room !== socket.id) {
                io.emit('screen_status_changed', { screenId: room, status: 'offline' });
            }
        });
    });

    socket.on('disconnect', () => {
        console.log(`❌ Device disconnected: ${socket.id}`);
    });
});

const PORT = process.env.port || 5000;

config({ path: path.resolve(process.cwd(), '.env') });

console.log("FRONTEND_URL:", process.env.FRONTEND_URL); // Should print http://localhost:3001

sequelize.sync({ alter: true }).then(() => {
    httpServer.listen(PORT, () => {
        console.log(`SignCraft Bun Server running on http://localhost:${PORT}`);
    });
}).catch((err: any) => {
    console.error('Database Sync Failed:', err);
});