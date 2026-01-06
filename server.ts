

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




// 1. Load environment variables at the very top
dotenv.config();

// 2. Initialize the App and Server objects FIRST
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*" }
});

// 3. IMPORTANT: Allow controllers to use socket.io
app.set('socketio', io);

// new VIEW ENGINE SETUP
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 🔹 Needed for form submissions
app.use(express.urlencoded({ extended: true }));

// 4. --- IMPORT ALL MODELS TO FORCE TABLE CREATION ---
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

// 5. GLOBAL MIDDLEWARE
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(cookieParser());

// 6. ROUTE IMPORTS
import designingRoutes from './routes/designingRoute';
import accountsRoute from './routes/accountsRoute';
import errorsRoute from './routes/errorsRoute';
import generalRoute from './routes/generalRoute';

// 7. ASSIGN ROUTES
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

                // 1. Join the Room
                socket.join(longID);

                // 2. Log success for debugging
                const roomSize = io.sockets.adapter.rooms.get(longID)?.size || 0;
                console.log(`✅ Screen Verified: ${screenData.screenName} | Room: ${longID} | Devices: ${roomSize}`);

                // 3. Respond to App
                socket.emit('registration_success', {
                    screenId: longID,
                    name: screenData.screenName
                });

            } else {
                console.log(`❌ Invalid Screen ID: ${screenUUID}`);
                socket.emit('registration_failed', { msg: 'Screen ID not found' });
            }

        } catch (err) {
            console.error("Socket DB Error:", err);
            socket.emit('registration_failed', { msg: 'Server Database Error' });
        }
    });

    // WEB: Join Room (For live dashboard updates)
    socket.on('join_dashboard', () => {
        console.log(`💻 Web Dashboard Connected: ${socket.id}`);
    });

    socket.on('disconnect', () => {
        // Optional: Check which rooms they were in to log specific screen disconnects
        console.log(`❌ Device disconnected: ${socket.id}`);
    });
});

// 9. START SERVER
const PORT = process.env.port || 5000;

config({ path: path.resolve(process.cwd(), '.env') });

console.log("📍 FRONTEND_URL:", process.env.FRONTEND_URL); // Should print http://localhost:3001

sequelize.sync({ alter: true }).then(() => {
    httpServer.listen(PORT, () => {
        console.log(`SignCraft Bun Server running on http://localhost:${PORT}`);
    });
}).catch((err: any) => {
    console.error('Database Sync Failed:', err);
});