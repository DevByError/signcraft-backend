import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import screen from '../models/designing/screen';
import design from '../models/designing/design';
import playlist from '../models/designing/playlist';
import playlistItem from '../models/designing/playlistItem';


// GET ALL SCREENS (Includes Playlist Name)
export const getscreens = (req: Request, res: Response) => {
    screen.findAll({
        where: { sts: true },
        include: [{ model: playlist, attributes: ['name'] }] // Join to get playlist name
    }).then((result: any) => {
        if (result) {
            res.status(200).send({ success: true, data: result });
        } else {
            res.status(200).send({ success: false, msg: 'No screens' });
        }
    });
};

// GET SCREEN BY ID (Includes Playlist Name for the UI)
export const getscreenbyid = (req: Request, res: Response) => {
    screen.findOne({
        where: { id: req.query.id, sts: true },
        include: [{ model: playlist, attributes: ['name'] }]
    }).then((result: any) => {
        if (result) {
            res.status(200).send({ success: true, data: result });
        } else {
            res.status(200).send({ success: false, msg: 'Screen not found' });
        }
    });
};

// CREATE OR UPDATE SCREEN
export const postscreenupdate = (req: Request, res: Response) => {
    if (req.body.id) {
        // EDIT NAME OR PLAYLIST
        screen.update({
            screenName: req.body.screenName,
            screenLocation: req.body.screenLocation,
            playlistId: req.body.playlistId,
            UpdatedBy: req.body.userID
        }, { where: { id: req.body.id } }).then(() => {
            res.status(200).send({ success: true, msg: 'Screen Updated' });
        });
    } else {
        // CREATE NEW DEVICE LINK
        // Use uuidv4 for the ID - this is what you link with Android
        screen.create({
            id: uuidv4(),
            screenName: req.body.screenName,
            screenLocation: req.body.screenLocation,
            screenCustomId: req.body.screenCustomId || uuidv4().substring(0, 8), // A short code for display
            playlistId: req.body.playlistId,
            CreatedBy: req.body.userID,
            sts: true
        }).then((result: any) => {
            res.status(200).send({ success: true, data: result });
        });
    }
};

// DELETE SCREEN
export const postdelscreen = (req: Request, res: Response) => {
    screen.update({ sts: false }, { where: { id: req.body.id } }).then((result: any) => {
        res.status(200).send({ success: true, msg: 'Screen Removed' });
    });
};

// Logic to send content to the Android Screen via Socket
export const postdeploytoscreen = (req: Request, res: Response) => {
    const screenId = req.body.screenId; // The Screen UUID

    // 1. Find the screen and its assigned playlist
    screen.findOne({ where: { id: screenId, sts: true } }).then((screenData: any) => {
        if (!screenData || !screenData.playlistId) {
            return res.status(200).send({ success: false, msg: 'Screen has no playlist assigned' });
        }

        // 2. Get the Playlist Items and the Video URLs from the Design table
        playlist.findOne({
            where: { id: screenData.playlistId, sts: true },
            include: [{
                model: playlistItem,
                include: [{
                    model: design,
                    attributes: ['videoUrl', 'title'] // We ONLY care about the S3 URL
                }],
                required: true
            }],
            order: [[playlistItem, 'slno', 'ASC']]
        }).then((playlistData: any) => {
            if (!playlistData || !playlistData.tblplaylistitems) {
                return res.status(200).send({ success: false, msg: 'Playlist is empty' });
            }

            // 3. Filter only items that have a generated videoUrl
            const videoQueue = playlistData.tblplaylistitems
                .filter((item: any) => item.tbldesign.videoUrl != null)
                .map((item: any) => ({
                    url: item.tbldesign.videoUrl, // The AWS S3 Link
                    duration: item.duration,      // How long to stay on this video
                    title: item.tbldesign.title
                }));

            if (videoQueue.length === 0) {
                return res.status(200).send({ success: false, msg: 'No designs in this playlist have been exported to video yet.' });
            }

            // 4. Send the URL List through Socket.io to the Screen UUID room
            const io = req.app.get('socketio');
            if (io) {
                io.to(screenId).emit('play_video_playlist', {
                    playlistName: playlistData.name,
                    queue: videoQueue
                });
                res.status(200).send({ success: true, msg: 'Playlist pushed to screen successfully' });
            } else {
                res.status(500).send({ success: false, msg: 'Socket server error' });
            }
        });
    });
};