import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import screen from '../models/designing/screen';
import playlist from '../models/designing/playlist';
import playlistItem from '../models/designing/playlistItem';
import design from '../models/designing/design';
import schedule from '../models/designing/schedule';
import { uploadFileToS3 } from '../utils/s3Uploader';
import puppeteer from 'puppeteer';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import fs from 'fs';
import path from 'path';

// Helper: Get Active Socket Count for a Room (Screen)
const getConnectedCount = (io: any, screenId: string) => {
    if (!io || !io.sockets) return 0;
    const room = io.sockets.adapter.rooms.get(screenId);
    return room ? room.size : 0;
};

// HELPER: Safely extract UserID
const getUserID = (req: Request): string | null => {
    const r = req as any;
    if (r.user && (r.user.userId || r.user.id)) return r.user.userId || r.user.id;
    if (req.body && req.body.userID) return req.body.userID;
    return null;
};

const generatePlaylistVideo = async (
    playlistId: string,
    token: string,
    io: any,
    socketId: string,
    totalDurationMs: number,
    maxWidth: number,
    maxHeight: number
): Promise<string> => {
    const tempFileName = `final_render_${playlistId}_${Date.now()}.mp4`;
    const tempPath = path.join(process.cwd(), tempFileName);
    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3001';

    const emitProgress = (progress: number, stage: string) => {
        if (io && socketId) {
            io.to(socketId).emit('deployment_progress', { progress, stage, playlistId });
        }
    };

    emitProgress(5, "Initializing Recording Engine...");

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // 1. Set Viewport to the maximum canvas size in the playlist
        await page.setViewport({ width: maxWidth, height: maxHeight });

        // 2. Inject Auth Token (Headless Login)
        await page.goto(`${frontendBase}/#/login`, { waitUntil: 'networkidle0' });
        await page.evaluate((t) => { localStorage.setItem('authtoken', t); }, token);
        await page.setCookie({
            name: 'authtoken',
            value: token,
            domain: new URL(frontendBase).hostname,
            path: '/'
        });

        const recorder = new PuppeteerScreenRecorder(page, {
            followNewTab: true,
            fps: 30,
            videoFrame: { width: maxWidth, height: maxHeight },
            aspectRatio: '16:9',
        });

        // 3. Open Playlist Preview with recording=true (Hides all UI)
        const playlistUrl = `${frontendBase}/#/playlist/preview/${playlistId}?recording=true`;
        await page.goto(playlistUrl, { waitUntil: 'networkidle2' });

        // 4. Wait for the frontend to signal it's ready
        await page.waitForSelector('.design-canvas-ready', { timeout: 10000 });

        emitProgress(15, "Starting Seamless Capture...");
        await recorder.start(tempPath);

        // 5. Record for the exact total duration
        const startTime = Date.now();
        while (Date.now() - startTime < totalDurationMs) {
            const elapsed = Date.now() - startTime;
            const percent = Math.round(15 + (elapsed / totalDurationMs) * 75);
            emitProgress(percent, `Recording Playlist: ${Math.round(elapsed / 1000)}s / ${Math.round(totalDurationMs / 1000)}s`);
            await new Promise(r => setTimeout(r, 1000));
        }

        await recorder.stop();
        emitProgress(92, "Uploading to Cloud...");

        const s3Url = await uploadFileToS3(tempPath, `playlist_${playlistId}.mp4`);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

        emitProgress(100, "Finalized!");
        return s3Url;
    } catch (error) {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        if (io && socketId) io.to(socketId).emit('deployment_error', { msg: "Recording failed." });
        throw error;
    } finally {
        await browser.close();
    }
};

// ==========================================
// 🚀 DEPLOY CONTROLLER
// ==========================================
export const postdeploytoscreen = async (req: Request, res: Response) => {
    const { screenIds, playlistId, mode, startTime, endTime } = req.body;
    const userID = getUserID(req);
    const token = req.cookies?.authtoken || req.headers.authorization?.split(' ')[1];
    const socketId = req.headers['x-socket-id'] as string;

    if (!userID || !token) return res.status(401).send({ success: false, msg: 'Unauthorized' });

    const io = req.app.get('socketio');

    try {
        const validScreens = await screen.findAll({
            where: { id: { [Op.in]: screenIds }, CreatedBy: userID, sts: true },
            attributes: ['id']
        });
        const validIds = validScreens.map((s: any) => s.id);
        if (validIds.length === 0) return res.status(200).send({ success: false, msg: 'No valid screens.' });

        const plData: any = await playlist.findOne({
            where: { id: playlistId },
            include: [{ model: playlistItem, include: [{ model: design }], required: true }],
            order: [[playlistItem, 'slno', 'ASC']]
        });

        if (!plData || !plData.tblplaylistitems.length) {
            return res.status(200).send({ success: false, msg: 'Playlist is empty.' });
        }

        // --- PRE-CALCULATE METADATA ---
        let totalDurationMs = 0;
        let maxWidth = 0;
        let maxHeight = 0;

        plData.tblplaylistitems.forEach((item: any) => {
            totalDurationMs += (item.duration || 10) * 1000;
            const w = Number(item.tbldesign?.canvasData?.metadata?.canvasWidth) || 1920;
            const h = Number(item.tbldesign?.canvasData?.metadata?.canvasHeight) || 1080;
            if (w > maxWidth) maxWidth = w;
            if (h > maxHeight) maxHeight = h;
        });

        // Respond immediately (202 Accepted)
        res.status(202).send({ success: true, msg: 'Generating content...' });

        // Generate video in background
        const s3VideoUrl = await generatePlaylistVideo(
            playlistId,
            token,
            io,
            socketId,
            totalDurationMs,
            maxWidth,
            maxHeight
        );

        // Update database and emit to screens
        for (const sId of validIds) {
            let start = mode === 'NOW' ? new Date() : new Date(startTime);
            let end = mode === 'NOW' ? new Date(Date.now() + 86400000) : new Date(endTime);

            await schedule.create({
                id: uuidv4(),
                screenId: sId,
                playlistId: playlistId,
                startTime: start,
                endTime: end,
                isImmediate: mode === 'NOW',
                sts: true
            });

            await screen.update({ playlistId: playlistId }, { where: { id: sId } });

            if (io) {
                io.to(sId).emit('update_schedule', {
                    action: 'SYNC_VIDEO',
                    videoUrl: s3VideoUrl,
                    playlistName: plData.name,
                    schedule: {
                        start: start.toISOString(),
                        end: end.toISOString(),
                        isImmediate: mode === 'NOW'
                    }
                });
            }
        }
    } catch (err: any) {
        console.error("Deployment Error:", err);
        if (io && socketId) io.to(socketId).emit('deployment_error', { msg: err.message });
    }
};
// ==========================================
// 1. GET ALL SCREENS
// ==========================================
export const getscreens = async (req: Request, res: Response) => {
    try {
        const userID = getUserID(req);
        if (!userID) return res.status(401).send({ success: false, msg: 'Unauthorized' });

        const screens = await screen.findAll({
            where: { sts: true, CreatedBy: userID },
            include: [{ model: playlist, attributes: ['name'] }]
        });

        const io = req.app.get('socketio');
        const data = screens.map((s: any) => ({
            ...s.dataValues,
            connectedDevices: getConnectedCount(io, s.id),
            status: getConnectedCount(io, s.id) > 0 ? 'online' : 'offline'
        }));

        res.status(200).send({ success: true, data });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, msg: 'Error fetching screens' });
    }
};

// ==========================================
// 2. GET SCREEN BY ID
// ==========================================
export const getscreenbyid = async (req: Request, res: Response) => {
    try {
        const userID = getUserID(req);
        if (!userID) return res.status(401).send({ success: false, msg: 'Unauthorized' });

        const result: any = await screen.findOne({
            where: { id: req.query.id as string, sts: true, CreatedBy: userID },
            include: [{ model: playlist, attributes: ['name'] }]
        });

        if (result) {
            const io = req.app.get('socketio');
            const data = {
                ...result.dataValues,
                connectedDevices: getConnectedCount(io, result.id),
                status: getConnectedCount(io, result.id) > 0 ? 'online' : 'offline'
            };
            res.status(200).send({ success: true, data });
        } else {
            res.status(200).send({ success: false, msg: 'Screen not found' });
        }
    } catch (err) {
        res.status(500).send({ success: false, msg: 'Error fetching screen' });
    }
};

// ==========================================
// 3. CREATE / UPDATE
// ==========================================
export const postscreenupdate = async (req: Request, res: Response) => {
    try {
        const userID = getUserID(req);
        if (!userID) return res.status(401).send({ success: false, msg: 'Unauthorized' });

        if (req.body.id) {
            await screen.update({
                screenName: req.body.screenName,
                screenLocation: req.body.screenLocation,
                UpdatedBy: userID
            }, { where: { id: req.body.id, CreatedBy: userID } });
            res.status(200).send({ success: true, msg: 'Screen Updated' });
        } else {
            await screen.create({
                id: uuidv4(),
                screenName: req.body.screenName,
                screenLocation: req.body.screenLocation,
                screenCustomId: req.body.screenCustomId || uuidv4().substring(0, 6).toUpperCase(),
                CreatedBy: userID,
                sts: true
            });
            res.status(200).send({ success: true, msg: 'Screen Created' });
        }
    } catch (err: any) {
        res.status(500).send({ success: false, msg: err.message });
    }
};

// ==========================================
// 4. DELETE SCREEN
// ==========================================
export const postdelscreen = async (req: Request, res: Response) => {
    try {
        const userID = getUserID(req);
        if (!userID) return res.status(401).send({ success: false, msg: 'Unauthorized' });

        await schedule.destroy({ where: { screenId: req.body.id } });

        const deleted = await screen.destroy({
            where: {
                id: req.body.id,
                CreatedBy: userID
            }
        });

        if (deleted === 0) {
            return res.status(200).send({ success: false, msg: 'Screen not found or access denied' });
        }

        res.status(200).send({ success: true, msg: 'Screen Permanently Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, msg: 'Error deleting screen' });
    }
};

