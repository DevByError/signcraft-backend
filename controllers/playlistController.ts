// import type { Request, Response } from 'express';
// import { v4 as uuidv4 } from 'uuid';
// import playlist from '../models/designing/playlist';
// import playlistItem from '../models/designing/playlistItem';
// import design from '../models/designing/design'; // Ensure design model is imported


// const getSecureUserId = (req: Request): string | undefined => {
//     // Rely solely on middleware to set userID
//     return (req as any).userID;
// };


// export const getplaylists = async (req: Request, res: Response) => {
//     const userId = getSecureUserId(req);

//     if (!userId) {
//         // This indicates chktoken middleware failed or was not applied to the route
//         console.warn('Unauthorized attempt to get playlists: userId missing from token.');
//         return res.status(401).send({ success: false, msg: 'Unauthorized: Session Invalid' });
//     }

//     try {
//         const result = await playlist.findAll({
//             where: { sts: true, userId: userId },
//             include: [{ model: playlistItem, attributes: ['id', 'duration', 'startTime', 'endTime'] }],
//             order: [['updatedAt', 'DESC']]
//         });

//         const formattedData = result.map((p: any) => {
//             const items = p.tblplaylistitems || [];
//             const totalDuration = items.reduce((sum: number, item: any) => sum + (item.duration || 0), 0);
//             return {
//                 id: p.id,
//                 name: p.name,
//                 description: p.description,
//                 userId: p.userId,
//                 updatedAt: p.updatedAt,
//                 itemCount: items.length,
//                 totalDuration: totalDuration
//             };
//         });

//         res.status(200).send({ success: true, data: formattedData });
//     } catch (err: any) {
//         console.error('Error fetching playlists:', err);
//         res.status(500).send({ success: false, msg: 'Error fetching playlists' });
//     }
// };


// export const postsaveplaylist = async (req: Request, res: Response) => {
//     const userId = getSecureUserId(req);

//     if (!userId) {
//         return res.status(401).send({ success: false, msg: 'Unauthorized: Session Invalid' });
//     }

//     try {
//         if (req.body.id) {
//             // Update existing playlist
//             const existing = await playlist.findOne({ where: { id: req.body.id, userId } });
//             if (!existing) {
//                 return res.status(403).send({ success: false, msg: 'Playlist not found or access denied' });
//             }

//             await playlist.update({
//                 name: req.body.name,
//                 description: req.body.description,
//                 UpdatedBy: userId // Set UpdatedBy from token
//             }, { where: { id: req.body.id } });

//             res.status(200).send({ success: true, msg: 'Playlist Updated' });
//         } else {
//             // Create new playlist
//             const newId = uuidv4();
//             const result = await playlist.create({
//                 id: newId,
//                 name: req.body.name,
//                 description: req.body.description,
//                 userId: userId, // Set userId from token (Foreign Key)
//                 CreatedBy: userId // Set CreatedBy from token
//             });
//             res.status(200).send({ success: true, data: result, msg: 'Playlist Created' });
//         }
//     } catch (err: any) {
//         console.error('Save playlist error:', err);
//         if (err.name === 'SequelizeForeignKeyConstraintError') {
//             return res.status(400).send({ success: false, msg: 'Invalid User ID: User does not exist.' });
//         }
//         res.status(500).send({ success: false, msg: err.message });
//     }
// };


// export const postsyncplaylistitems = async (req: Request, res: Response) => {
//     const { playlistId, items } = req.body;
//     const userId = getSecureUserId(req); // From token

//     if (!userId) {
//         return res.status(401).send({ success: false, msg: 'Unauthorized: Session Invalid' });
//     }

//     try {
//         // First, verify the playlist belongs to the user
//         const existingPlaylist = await playlist.findOne({ where: { id: playlistId, userId } });
//         if (!existingPlaylist) {
//             return res.status(403).send({ success: false, msg: 'Playlist not found or access denied' });
//         }

//         // Use a transaction for atomicity (optional, but good practice for bulk operations)
//         await playlistItem.destroy({ where: { playlistId } });

//         if (items && items.length > 0) {
//             const records = items.map((item: any) => ({
//                 id: uuidv4(),
//                 playlistId: playlistId,
//                 designId: item.designId,
//                 slno: item.slno,
//                 // duration: item.duration, // Prioritize start/end time if available
//                 startTime: item.startTime,
//                 endTime: item.endTime,
//                 duration: item.duration || 10,
//                 CreatedBy: userId, // Set CreatedBy from token
//                 sts: true
//             }));
//             await playlistItem.bulkCreate(records);
//         }

//         res.status(200).send({ success: true, msg: 'Playlist sequence synced' });
//     } catch (err: any) {
//         console.error('Sync playlist items error:', err);
//         res.status(500).send({ success: false, msg: err.message });
//     }
// };


// export const getplaylistdetails = async (req: Request, res: Response) => {
//     const playlistId = req.query.id as string;
//     const userId = getSecureUserId(req); // From token

//     if (!userId) {
//         return res.status(401).send({ success: false, msg: 'Unauthorized: Session Invalid' });
//     }
//     if (!playlistId) {
//         return res.status(400).send({ success: false, msg: 'Playlist ID required' });
//     }

//     try {
//         const result = await playlist.findOne({
//             where: { id: playlistId, userId, sts: true }, // Ensure ownership
//             include: [{
//                 model: playlistItem,
//                 include: [{ model: design, attributes: ['id', 'title', 'canvasData', 'timelineData'] }] // Include only necessary design data
//             }],
//             order: [[playlistItem, 'slno', 'ASC']]
//         });

//         if (result) res.status(200).send({ success: true, data: result });
//         else res.status(404).send({ success: false, msg: 'Playlist not found or access denied' });
//     } catch (err: any) {
//         console.error('Get playlist details error:', err);
//         res.status(500).send({ success: false, msg: 'Error fetching playlist details' });
//     }
// };



// export const postdelplaylist = async (req: Request, res: Response) => {
//     const playlistId = req.body.id;
//     const userId = getSecureUserId(req);

//     if (!userId) {
//         return res.status(401).send({ success: false, msg: 'Unauthorized: Session Invalid' });
//     }
//     if (!playlistId) {
//         return res.status(400).send({ success: false, msg: 'Playlist ID required' });
//     }

//     try {

//         await playlistItem.destroy({
//             where: { playlistId: playlistId }
//         });


//         const deleted = await playlist.destroy({
//             where: {
//                 id: playlistId,
//                 userId: userId
//             }
//         });

//         if (deleted > 0) {
//             res.status(200).send({
//                 success: true,
//                 msg: 'Playlist and its items permanently deleted from database'
//             });
//         } else {
//             res.status(404).send({
//                 success: false,
//                 msg: 'Playlist not found or access denied'
//             });
//         }
//     } catch (err: any) {
//         console.error('Delete playlist error:', err);
//         res.status(500).send({
//             success: false,
//             msg: 'Error permanently deleting playlist: ' + err.message
//         });
//     }
// };


import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import playlist from '../models/designing/playlist';
import playlistItem from '../models/designing/playlistItem';
import design from '../models/designing/design';

const getSecureUserId = (req: Request): string | undefined => {
    return (req as any).userID; // Ensure your auth middleware sets this
};

// --- GET ALL PLAYLISTS ---
export const getplaylists = async (req: Request, res: Response) => {
    const userId = getSecureUserId(req);
    if (!userId) return res.status(401).send({ success: false, msg: 'Unauthorized' });

    try {
        const result = await playlist.findAll({
            where: { sts: true, userId: userId },
            include: [{ model: playlistItem, attributes: ['duration'] }],
            order: [['updatedAt', 'DESC']]
        });

        const formattedData = result.map((p: any) => {
            const items = p.tblplaylistitems || [];
            // Calculate total duration based on the new 'duration' column
            const totalDuration = items.reduce((sum: number, item: any) => sum + (item.duration || 0), 0);
            return {
                id: p.id,
                name: p.name,
                description: p.description,
                userId: p.userId,
                updatedAt: p.updatedAt,
                itemCount: items.length,
                totalDuration: totalDuration
            };
        });

        res.status(200).send({ success: true, data: formattedData });
    } catch (err: any) {
        console.error("Get Playlists Error:", err);
        res.status(500).send({ success: false, msg: 'Error fetching playlists' });
    }
};

// --- SAVE (CREATE/UPDATE) PLAYLIST ---
export const postsaveplaylist = async (req: Request, res: Response) => {
    const userId = getSecureUserId(req);
    if (!userId) return res.status(401).send({ success: false, msg: 'Unauthorized' });

    try {
        if (req.body.id) {
            await playlist.update({
                name: req.body.name,
                description: req.body.description,
                UpdatedBy: userId
            }, { where: { id: req.body.id } });
            res.status(200).send({ success: true, msg: 'Playlist Updated' });
        } else {
            const newId = uuidv4();
            const result = await playlist.create({
                id: newId,
                name: req.body.name,
                description: req.body.description,
                userId: userId,
                CreatedBy: userId
            });
            res.status(200).send({ success: true, data: result, msg: 'Playlist Created' });
        }
    } catch (err: any) {
        console.error("Save Playlist Error:", err);
        res.status(500).send({ success: false, msg: err.message });
    }
};

// --- SYNC ITEMS (SAVES DURATION) ---
export const postsyncplaylistitems = async (req: Request, res: Response) => {
    const { playlistId, items } = req.body;
    const userId = getSecureUserId(req);
    if (!userId) return res.status(401).send({ success: false, msg: 'Unauthorized' });

    try {
        // 1. Check ownership
        const existingPlaylist = await playlist.findOne({ where: { id: playlistId, userId } });
        if (!existingPlaylist) return res.status(403).send({ success: false, msg: 'Access denied' });

        // 2. Delete old items
        await playlistItem.destroy({ where: { playlistId } });

        // 3. Create new items with DURATION
        if (items && items.length > 0) {
            const records = items.map((item: any) => ({
                id: uuidv4(),
                playlistId: playlistId,
                designId: item.designId,
                slno: item.slno,
                // Ensure duration is an Integer
                duration: parseInt(item.duration) || 10,
                CreatedBy: userId,
                sts: true
            }));
            await playlistItem.bulkCreate(records);
        }

        res.status(200).send({ success: true, msg: 'Playlist sequence synced' });
    } catch (err: any) {
        console.error("Sync Items Error:", err);
        res.status(500).send({ success: false, msg: err.message });
    }
};

// --- GET DETAILS (FIXED 500 ERROR HERE) ---
export const getplaylistdetails = async (req: Request, res: Response) => {
    const playlistId = req.query.id as string;
    const userId = getSecureUserId(req);
    if (!userId) return res.status(401).send({ success: false, msg: 'Unauthorized' });

    try {
        // REMOVED 'order' property here to prevent Sequelize crash
        const result: any = await playlist.findOne({
            where: { id: playlistId, userId, sts: true },
            include: [{
                model: playlistItem,
                include: [{ model: design, attributes: ['id', 'title', 'canvasData', 'timelineData'] }]
            }]
        });

        if (result) {
            // MANUALLY SORT in JavaScript (Much safer)
            if (result.tblplaylistitems && result.tblplaylistitems.length > 0) {
                result.tblplaylistitems.sort((a: any, b: any) => a.slno - b.slno);
            }
            res.status(200).send({ success: true, data: result });
        } else {
            res.status(404).send({ success: false, msg: 'Not found' });
        }
    } catch (err: any) {
        console.error("Get Playlist Details Error:", err); // Check your terminal when this happens!
        res.status(500).send({ success: false, msg: 'Error fetching playlist details' });
    }
};

export const postdelplaylist = async (req: Request, res: Response) => {
    const playlistId = req.body.id;
    const userId = getSecureUserId(req);
    if (!userId) return res.status(401).send({ success: false, msg: 'Unauthorized' });

    try {
        await playlistItem.destroy({ where: { playlistId: playlistId } });
        const deleted = await playlist.destroy({ where: { id: playlistId, userId: userId } });

        if (deleted > 0) res.status(200).send({ success: true, msg: 'Deleted' });
        else res.status(404).send({ success: false, msg: 'Not found' });
    } catch (err: any) {
        res.status(500).send({ success: false, msg: err.message });
    }
};