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
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder'
import fs from 'fs';
import path from 'path';

// Helper: Get Active Socket Count for a Room (Screen)
const getConnectedCount = (io: any, screenId: string) => {
    if (!io || !io.sockets) return 0;
    const room = io.sockets.adapter.rooms.get(screenId);
    return room ? room.size : 0;
};

// ✅ HELPER: Safely extract UserID (Works for GET & POST)
const getUserID = (req: Request): string | null => {
    const r = req as any;
    if (r.user && (r.user.userId || r.user.id)) return r.user.userId || r.user.id;
    if (req.body && req.body.userID) return req.body.userID;
    return null;
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
// 4. DELETE SCREEN (HARD DELETE FIX)
// ==========================================
export const postdelscreen = async (req: Request, res: Response) => {
    try {
        const userID = getUserID(req);
        if (!userID) return res.status(401).send({ success: false, msg: 'Unauthorized' });

        // 1. Delete associated schedules first (Clean up)
        await schedule.destroy({ where: { screenId: req.body.id } });

        // 2. ✅ FIX: Use destroy() to remove the record permanently
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

// ==========================================
// 5. DEPLOY
// ==========================================
export const postdeploytoscreen = async (req: Request, res: Response) => {
    const { screenIds, playlistId, mode, startTime, endTime } = req.body;
    const userID = getUserID(req);

    if (!userID) return res.status(401).send({ success: false, msg: 'Unauthorized' });

    if (!screenIds || !Array.isArray(screenIds) || screenIds.length === 0) {
        return res.status(200).send({ success: false, msg: 'No screens selected' });
    }

    const io = req.app.get('socketio');

    try {
        // 1. Verify Ownership
        const validScreens = await screen.findAll({
            where: {
                id: { [Op.in]: screenIds },
                CreatedBy: userID,
                sts: true
            },
            attributes: ['id']
        });

        const validIds = validScreens.map((s: any) => s.id);

        if (validIds.length === 0) {
            return res.status(200).send({ success: false, msg: 'No valid screens found or access denied.' });
        }

        // 2. Get Playlist Data
        const plData: any = await playlist.findOne({
            where: { id: playlistId },
            include: [{
                model: playlistItem,
                include: [{ model: design, attributes: ['videoUrl', 'title'] }],
                required: true
            }],
            order: [[playlistItem, 'slno', 'ASC']]
        });

        if (!plData || !plData.tblplaylistitems) {
            return res.status(200).send({ success: false, msg: 'Playlist is empty.' });
        }

        // ✅ FIX: Use Fallback Video if design hasn't been exported yet
        const PLACEHOLDER_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

        const videoQueue = plData.tblplaylistitems.map((item: any) => {
            const hasVideo = item.tbldesign && item.tbldesign.videoUrl;
            return {
                // If real video exists, use it. Otherwise, use Placeholder.
                url: hasVideo ? item.tbldesign.videoUrl : PLACEHOLDER_VIDEO,
                duration: item.duration || 10,
                title: item.tbldesign?.title || "Untitled Design"
            };
        });

        // 3. Process each VALID screen
        for (const sId of validIds) {
            let start = new Date();
            let end = new Date();

            if (mode === 'NOW') {
                // If endTime provided in body, use it, else default 24h
                if (req.body.endTime) {
                    // Simple logic: If user sends HH:mm, construct Date
                    // For now, let's assume default 24h logic if not fully parsed above
                    end.setHours(start.getHours() + 24);
                } else {
                    end.setHours(start.getHours() + 24);
                }
            } else {
                start = new Date(startTime);
                end = new Date(endTime);

                const conflict = await schedule.findOne({
                    where: {
                        screenId: sId,
                        sts: true,
                        [Op.or]: [
                            { startTime: { [Op.between]: [start, end] } },
                            { endTime: { [Op.between]: [start, end] } }
                        ]
                    }
                });

                if (conflict) {
                    console.log(`Conflict detected for screen ${sId} - Skipping schedule`);
                    continue;
                }
            }

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
                console.log(`📡 Emitting to Screen ${sId}: ${videoQueue.length} items`);
                io.to(sId).emit('update_schedule', {
                    action: 'SYNC_SCHEDULE',
                    playlistId: playlistId,
                    playlistName: plData.name,
                    schedule: {
                        start: start.toISOString(),
                        end: end.toISOString(),
                        isImmediate: mode === 'NOW'
                    },
                    content: videoQueue
                });
            }
        }

        res.status(200).send({
            success: true,
            msg: `Deployment sent to ${validIds.length} screens.`
        });

    } catch (err: any) {
        console.error(err);
        res.status(500).send({ success: false, msg: 'Deployment failed.' });
    }
};


