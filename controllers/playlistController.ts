import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import playlist from '../models/designing/playlist';
import playlistItem from '../models/designing/playlistItem';
import design from '../models/designing/design';

// GET ALL PLAYLISTS
export const getplaylists = (req: Request, res: Response) => {
    playlist.findAll({ where: { sts: true } }).then((result: any) => {
        if (result) {
            res.status(200).send({ success: true, data: result });
        } else {
            res.status(200).send({ success: false, msg: 'No playlists' });
        }
    });
};

// SAVE PLAYLIST (Name Only)
export const postsaveplaylist = (req: Request, res: Response) => {
    if (req.body.id) {
        playlist.update({ name: req.body.name, UpdatedBy: req.body.userID }, { where: { id: req.body.id } }).then(() => {
            res.status(200).send({ success: true, msg: 'Playlist Renamed' });
        });
    } else {
        playlist.create({ id: uuidv4(), name: req.body.name, CreatedBy: req.body.userID, sts: true }).then((result: any) => {
            res.status(200).send({ success: true, data: result });
        });
    }
};

// SYNC PLAYLIST DESIGNS (Add/Remove/Reorder)
// Expects req.body.items = [{designId: '...', slno: 1, duration: 10}, ...]
export const postsyncplaylistitems = (req: Request, res: Response) => {
    const playlistId = req.body.playlistId;
    // Step 1: Remove all current items in this playlist
    playlistItem.destroy({ where: { playlistId: playlistId } }).then(() => {
        // Step 2: Bulk create the new sequence
        const newItems = req.body.items.map((item: any) => ({
            id: uuidv4(),
            playlistId: playlistId,
            designId: item.designId,
            slno: item.slno,
            duration: item.duration,
            sts: true,
            CreatedBy: req.body.userID
        }));

        playlistItem.bulkCreate(newItems).then(() => {
            res.status(200).send({ success: true, msg: 'Playlist sequence updated' });
        });
    });
};

// GET PLAYLIST DETAILS (With Designs)
export const getplaylistdetails = (req: Request, res: Response) => {
    playlist.findOne({
        where: { id: req.query.id, sts: true },
        include: [{
            model: playlistItem,
            include: [{ model: design }]
        }],
        order: [[playlistItem, 'slno', 'ASC']]
    }).then((result: any) => {
        if (result) {
            res.status(200).send({ success: true, data: result });
        } else {
            res.status(200).send({ success: false, msg: 'Not found' });
        }
    });
};

// DELETE PLAYLIST (Soft Delete)
export const postdelplaylist = (req: Request, res: Response) => {
    playlist.update({ sts: false }, { where: { id: req.body.id } }).then((result: any) => {
        if (result[0] > 0) {
            res.status(200).send({ success: true, msg: 'Playlist deleted successfully' });
        } else {
            res.status(200).send({ success: false, msg: 'Playlist not found' });
        }
    });
};