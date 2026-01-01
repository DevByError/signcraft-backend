import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import playlist from '../models/designing/playlist';
import playlistItem from '../models/designing/playlistItem';
import design from '../models/designing/design';

// GET ALL PLAYLISTS (filtered by current user)
export const getplaylists = (req: Request, res: Response) => {
    const userId = (req as any).userID || req.body?.userID;
    
    console.log('📋 [PLAYLIST_CONTROLLER] Getting playlists for user:', userId);
    
    if (!userId) {
        console.error('❌ [PLAYLIST_CONTROLLER] User ID not found');
        return res.status(401).send({ success: false, msg: 'Unauthorized: User ID not found' });
    }

    playlist.findAll({ where: { sts: true, userId: userId } }).then((result: any) => {
        if (result && result.length > 0) {
            console.log(`✅ [PLAYLIST_CONTROLLER] Found ${result.length} playlists for user`);
            res.status(200).send({ success: true, data: result });
        } else {
            console.log('⚠️ [PLAYLIST_CONTROLLER] No playlists found for user');
            res.status(200).send({ success: true, data: [], msg: 'No playlists found' });
        }
    }).catch((err: any) => {
        console.error('❌ [PLAYLIST_CONTROLLER] Error fetching playlists:', err);
        res.status(500).send({ success: false, msg: 'Error fetching playlists' });
    });
};

// SAVE PLAYLIST (Create or Update - with userId)
export const postsaveplaylist = (req: Request, res: Response) => {
    // Extract userId with proper fallback chain:
    // 1. From middleware (req.userID set by chktoken)
    // 2. From request body (sent by frontend)
    const userId = (req as any).userID || req.body?.userID;
    
    console.log('💾 [PLAYLIST_CONTROLLER] Save playlist attempt');
    console.log('   - Middleware userID (req.userID):', (req as any).userID);
    console.log('   - Body userID (req.body.userID):', req.body?.userID);
    console.log('   - Final userId:', userId);
    console.log('   - Playlist ID:', req.body?.id || 'NEW');
    console.log('   - Playlist name:', req.body?.name);
    
    if (!userId || userId === 'undefined') {
        console.error('❌ [PLAYLIST_CONTROLLER] No valid userId found!');
        return res.status(401).send({ success: false, msg: 'Unauthorized: User ID not found' });
    }

    if (req.body.id) {
        // UPDATE EXISTING - verify ownership
        console.log('📝 [PLAYLIST_CONTROLLER] Updating existing playlist:', req.body.id);
        playlist.findOne({ where: { id: req.body.id, userId: userId } }).then((existingPlaylist: any) => {
            if (!existingPlaylist) {
                console.warn('⚠️ [PLAYLIST_CONTROLLER] Playlist not found for user:', userId);
                return res.status(403).send({ success: false, msg: 'Playlist not found or access denied' });
            }
            
            playlist.update(
                { name: req.body.name, description: req.body.description, UpdatedBy: userId }, 
                { where: { id: req.body.id, userId: userId } }
            ).then(() => {
                console.log('✅ [PLAYLIST_CONTROLLER] Playlist updated successfully');
                res.status(200).send({ success: true, msg: 'Playlist Updated' });
            }).catch(err => {
                console.error('❌ [PLAYLIST_CONTROLLER] Error updating playlist:', err.message);
                res.status(500).send({ success: false, msg: 'Update failed: ' + err.message });
            });
        }).catch(err => {
            console.error('❌ [PLAYLIST_CONTROLLER] Error verifying playlist:', err.message);
            res.status(500).send({ success: false, msg: 'Verification failed: ' + err.message });
        });
    } else {
        // CREATE NEW
        console.log('🆕 [PLAYLIST_CONTROLLER] Creating new playlist');
        console.log('   - userId:', userId);
        console.log('   - name:', req.body.name);
        console.log('   - description:', req.body.description || '(empty)');
        
        const newPlaylist = {
            id: uuidv4(),
            name: req.body.name,
            description: req.body.description || '',
            userId: userId,
            CreatedBy: userId,
            sts: true
        };
        
        console.log('   - Creating playlist with data:', newPlaylist);
        
        playlist.create(newPlaylist).then((result: any) => {
            console.log('✅ [PLAYLIST_CONTROLLER] Playlist created successfully');
            console.log('   - Playlist ID:', result.id);
            console.log('   - User ID:', result.userId);
            res.status(200).send({ success: true, data: result, msg: 'Playlist created successfully' });
        }).catch(err => {
            console.error('❌ [PLAYLIST_CONTROLLER] Error creating playlist');
            console.error('   - Error message:', err.message);
            if (err.errors && Array.isArray(err.errors)) {
                err.errors.forEach((e: any) => {
                    console.error('   - Validation error:', e.message, '(field:', e.path, ')');
                });
            }
            res.status(500).send({ success: false, msg: 'Creation failed: ' + err.message });
        });
    }
};

// SYNC PLAYLIST DESIGNS (Add/Remove/Reorder)
// Expects req.body.items = [{designId: '...', slno: 1, duration: 10}, ...]
export const postsyncplaylistitems = (req: Request, res: Response) => {
    const playlistId = req.body.playlistId;
    const userId = (req as any).userID || req.body?.userID;
    
    console.log('🔗 [PLAYLIST_CONTROLLER] Syncing playlist items');
    console.log('   - Playlist ID:', playlistId);
    console.log('   - User ID:', userId);
    console.log('   - Items count:', req.body.items?.length || 0);
    
    // Step 1: Remove all current items in this playlist
    playlistItem.destroy({ where: { playlistId: playlistId } }).then(() => {
        console.log('   - Removed old items');
        
        // Step 2: Bulk create the new sequence
        const newItems = req.body.items.map((item: any) => ({
            id: uuidv4(),
            playlistId: playlistId,
            designId: item.designId,
            slno: item.slno,
            duration: item.duration,
            sts: true,
            CreatedBy: userId || req.body.userID
        }));

        console.log('   - Creating', newItems.length, 'new items');
        
        playlistItem.bulkCreate(newItems).then(() => {
            console.log('✅ [PLAYLIST_CONTROLLER] Playlist items synced successfully');
            res.status(200).send({ success: true, msg: 'Playlist sequence updated' });
        }).catch((err: any) => {
            console.error('❌ [PLAYLIST_CONTROLLER] Error bulk creating items:', err.message);
            res.status(500).send({ success: false, msg: 'Failed to sync items: ' + err.message });
        });
    }).catch((err: any) => {
        console.error('❌ [PLAYLIST_CONTROLLER] Error removing old items:', err.message);
        res.status(500).send({ success: false, msg: 'Failed to sync items: ' + err.message });
    });
};

// GET PLAYLIST DETAILS (With Designs - user verified)
export const getplaylistdetails = (req: Request, res: Response) => {
    const playlistId = req.query.id as string;
    const userId = (req as any).userID || req.body?.userID;
    
    console.log('📋 [PLAYLIST_CONTROLLER] Getting playlist details:', { playlistId, userId });
    
    if (!userId) {
        console.error('❌ [PLAYLIST_CONTROLLER] User ID not found');
        return res.status(401).send({ success: false, msg: 'Unauthorized: User ID not found' });
    }
    
    if (!playlistId) {
        console.error('❌ [PLAYLIST_CONTROLLER] Playlist ID not provided');
        return res.status(400).send({ success: false, msg: 'Playlist ID required' });
    }
    
    if (!playlistId) {
        return res.status(400).send({ success: false, msg: 'Playlist ID required' });
    }
    
    if (!userId) {
        return res.status(401).send({ success: false, msg: 'Unauthorized: User ID not found' });
    }

    playlist.findOne({
        where: { id: playlistId, sts: true, userId: userId },
        include: [{
            model: playlistItem,
            include: [{ model: design }]
        }],
        order: [[playlistItem, 'slno', 'ASC']]
    }).then((result: any) => {
        if (result) {
            console.log('✅ [PLAYLIST_CONTROLLER] Playlist found, returning details');
            res.status(200).send({ success: true, data: result });
        } else {
            console.warn('⚠️ [PLAYLIST_CONTROLLER] Playlist not found for user:', userId);
            res.status(403).send({ success: false, msg: 'Playlist not found or access denied' });
        }
    }).catch((err: any) => {
        console.error('❌ [PLAYLIST_CONTROLLER] Error fetching playlist details:', err);
        res.status(500).send({ success: false, msg: 'Error fetching playlist' });
    });
};

// DELETE PLAYLIST (Soft Delete - with user verification)
export const postdelplaylist = (req: Request, res: Response) => {
    const playlistId = req.body.id;
    const userId = (req as any).userID || req.body?.userID;
    
    if (!playlistId) {
        return res.status(400).send({ success: false, msg: 'Playlist ID required' });
    }
    
    if (!userId) {
        return res.status(401).send({ success: false, msg: 'Unauthorized: User ID not found' });
    }

    // Verify ownership first
    playlist.findOne({ where: { id: playlistId, userId: userId } }).then((existingPlaylist: any) => {
        if (!existingPlaylist) {
            return res.status(403).send({ success: false, msg: 'Playlist not found or access denied' });
        }
        
        // Delete with userId filter to prevent accidents
        playlist.update({ sts: false }, { where: { id: playlistId, userId: userId } }).then((result: any) => {
            if (result[0] > 0) {
                res.status(200).send({ success: true, msg: 'Playlist deleted successfully' });
            } else {
                res.status(200).send({ success: false, msg: 'Error deleting playlist' });
            }
        }).catch((err: any) => {
            console.error('Error deleting playlist:', err);
            res.status(500).send({ success: false, msg: 'Error deleting playlist' });
        });
    }).catch((err: any) => {
        console.error('Error verifying playlist ownership:', err);
        res.status(500).send({ success: false, msg: 'Error verifying playlist' });
    });
};