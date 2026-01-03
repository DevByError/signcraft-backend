import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import sequelize from './utils/dbconnector';
import cors from 'cors';
import path from 'path';
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
import './models/designing/screen';

// 5. GLOBAL MIDDLEWARE (Order matters: CORS should be very early)
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

initAssociations();

// 8. SOCKET.IO LOGIC
io.on('connection', (socket) => {
    console.log('⚡ Device connected:', socket.id);

    socket.on('register-device', (data: { screenId: string }) => {
        if (data.screenId) {
            socket.join(data.screenId);
            console.log(`📡 Screen ${data.screenId} joined room`);
        }
    });

    socket.on('deployment_request', (data) => {
        io.to(data.screenId).emit('mobile-design-json', data.designData);
    });

    socket.on('disconnect', () => {
        console.log('❌ Device disconnected:', socket.id);
    });
});

// 9. START SERVER
const PORT = process.env.port || 5000;

sequelize.sync({ alter: true }).then(() => {
    httpServer.listen(PORT, () => {
        console.log(`SignCraft Bun Server running on http://localhost:${PORT}`);
    });
}).catch((err: any) => {
    console.error('Database Sync Failed:', err);
});