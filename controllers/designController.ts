import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import design from '../models/designing/design';
import { uploadVideoToS3 } from '../utils/s3Service';
import ffmpeg from 'fluent-ffmpeg';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import playlistItem from '../models/designing/playlistItem';
import multer from 'multer';
import login from '../models/management/login';

// GET ALL DESIGNS (filtered by user)
export const getalldesigns = async (req: Request, res: Response) => {
    // Get userId from middleware (set by chktoken)
    const userId = (req as any).userID || req.body?.userID;

    if (!userId) {
        return res.status(401).send({ success: false, msg: 'Unauthorized: User ID not found' });
    }

    await design.findAll({ where: { userId: userId, sts: true } }).then((result: any) => {
        if (result && result.length > 0) {
            res.status(200).send({ success: true, data: result });
        } else {
            res.status(200).send({ success: true, data: [], msg: 'No designs found' });
        }
    }).catch((err: any) => {
        console.error('Error fetching designs:', err);
        res.status(500).send({ success: false, msg: 'Error fetching designs' });
    });
};

// GET DESIGN BY ID (with user verification)
export const getdesignbyid = (req: Request, res: Response) => {
    const designId = req.query.id as string;
    // Get userId from middleware (set by chktoken)
    const userId = (req as any).userID || req.body?.userID;

    if (!designId) {
        return res.status(400).send({ success: false, msg: 'Design ID required' });
    }

    if (!userId) {
        return res.status(401).send({ success: false, msg: 'Unauthorized: User ID not found' });
    }

    design.findOne({ where: { id: designId, userId: userId, sts: true } }).then((result: any) => {
        if (result) {
            res.status(200).send({ success: true, data: result });
        } else {
            res.status(403).send({ success: false, msg: 'Design not found or access denied' });
        }
    }).catch((err: any) => {
        console.error('Error fetching design:', err);
        res.status(500).send({ success: false, msg: 'Error fetching design' });
    });
};

// CREATE OR UPDATE DESIGN (Name & Content)
export const postsavedesign = async (req: Request, res: Response) => {
    const activeUserId = (req as any).userID || req.body?.userID;

    if (!activeUserId) {
        return res.status(401).send({ success: false, msg: 'Unauthorized' });
    }

    try {
        if (req.body.id) {
            const existingDesign = await design.findOne({
                where: { id: req.body.id, userId: activeUserId }
            });

            if (!existingDesign) {
                return res.status(403).send({
                    success: false,
                    msg: 'Design not found or access denied'
                });
            }

            await design.update({
                title: req.body.title,
                canvasData: req.body.canvasData,
                timelineData: req.body.timelineData,
                UpdatedBy: activeUserId
            }, { where: { id: req.body.id } });

            const updated = await design.findByPk(req.body.id);

            return res.status(200).send({
                success: true,
                msg: 'Design Updated',
                data: updated
            });

        } else {
            const created = await design.create({
                id: uuidv4(),
                title: req.body.title,
                canvasData: req.body.canvasData,
                timelineData: req.body.timelineData,
                userId: activeUserId,
                CreatedBy: activeUserId,
                sts: true
            });

            return res.status(200).send({
                success: true,
                data: created
            });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send({
            success: false,
            msg: 'Save failed'
        });
    }
};


export const postdeldesign = async (req: Request, res: Response) => {
    try {
        const designId = req.body?.id;
        const userId = (req as any).userID;

        if (!designId) {
            return res.status(400).json({ success: false, msg: 'designId is required' });
        }

        // Find the design and check ownership
        const designExists = await design.findOne({
            where: { id: designId, userId, sts: true },
        });

        if (!designExists) {
            return res.status(404).json({
                success: false,
                msg: 'Design not found or you do not have permission',
            });
        }

        // Delete any linked playlist items first
        await playlistItem.destroy({ where: { designId } });

        // Delete the design
        await design.destroy({ where: { id: designId, userId: userId } });

        return res.status(200).json({ success: true, msg: 'Design deleted successfully' });
    } catch (err) {
        console.error('❌ [DELETE_DESIGN] Error:', err);
        return res.status(500).json({ success: false, msg: 'Internal server error' });
    }
};

export const postexportvideo = (req: Request, res: Response) => {
    const designId = req.body.id;
    // Get userId from middleware first, fall back to req.body
    const userId = (req as any).userId || req.body?.userId;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const bucketName = process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    const fps = 30;

    if (!designId) {
        return res.status(400).send({ success: false, msg: 'Design ID required' });
    }

    if (!userId) {
        return res.status(401).send({ success: false, msg: 'Unauthorized: User ID not found' });
    }

    // Verify design belongs to user
    design.findOne({ where: { id: designId, userId: userId, sts: true } }).then((designData: any) => {
        if (!designData) {
            res.status(404).send({ success: false, msg: 'Design not found or access denied' });
        } else {
            const tempDir = path.join(__dirname, `../../temp/${designId}`);
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const width = designData.canvasData.metadata?.canvasWidth || 1920;
            const height = designData.canvasData.metadata?.canvasHeight || 1080;

            puppeteer.launch({
                headless: true,
                args: ['--no-sandbox'],
                defaultViewport: { width, height }
            }).then((browser: any) => {
                browser.newPage().then((page: any) => {
                    const targetUrl = `${frontendUrl}/#/render/${designId}`;

                    page.goto(targetUrl, { waitUntil: 'networkidle2' }).then(async () => {

                        // Wait for Render.tsx to signal it is ready
                        await page.waitForFunction(() => (globalThis as any).isRenderPageReady === true, { timeout: 20000 });

                        const durationMs = designData.timelineData?.totalDuration || 5000;
                        const totalFrames = Math.ceil((durationMs / 1000) * fps);

                        console.log(`🎬 Rendering ${width}x${height} Video for S3...`);

                        for (let i = 0; i < totalFrames; i++) {
                            const timestamp = (i / fps) * 1000;
                            await page.evaluate((ms: number) => {
                                if ((globalThis as any).seekTo) (globalThis as any).seekTo(ms);
                            }, timestamp);

                            await new Promise(r => setTimeout(r, 60)); // Repaint delay

                            await page.screenshot({
                                path: path.join(tempDir, `frame-${i.toString().padStart(4, '0')}.png`),
                                type: 'png'
                            });
                        }

                        const videoFileName = `${designId}.mp4`;
                        const videoPath = path.join(tempDir, videoFileName);

                        ffmpeg()
                            .input(path.join(tempDir, 'frame-%04d.png'))
                            .inputFPS(fps)
                            .videoCodec('libx264')
                            .outputOptions(['-crf 23', '-preset fast', '-pix_fmt yuv420p'])
                            .save(videoPath)
                            .on('end', () => {
                                // UPLOAD TO AWS
                                uploadVideoToS3(videoPath, videoFileName).then(() => {
                                    // Generate the public S3 URL
                                    const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/outputs/${videoFileName}`;

                                    design.update({ videoUrl: s3Url }, { where: { id: designId } }).then(() => {
                                        browser.close();
                                        fs.rmSync(tempDir, { recursive: true, force: true });
                                        res.status(200).send({ success: true, url: s3Url });
                                        console.log(`✅ Export Complete! URL: ${s3Url}`);
                                    });
                                });
                            })
                            .on('error', (err: any) => {
                                console.error('FFmpeg failed:', err);
                                browser.close();
                                res.status(500).send({ success: false, msg: 'Stitching failed' });
                            });
                    });
                });
            });
        }
    });
};

// --- Middleware Setup ---
const uploadDir = 'temp_uploads/';

// Ensure temp folder exists
if (!fs.existsSync(uploadDir)) {
    console.log(`[Server] Creating temp directory: ${uploadDir}`);
    fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });
export const uploadMiddleware = upload.single('file');

// --- Controller Function ---
export const postuploadasset = async (req: Request, res: Response) => {
    console.log('--------------------------------------------------');
    console.log('[Controller] 📥 postuploadasset request received');

    try {
        const file = req.file;
        // Handle UserID from token (req.userID) or body (req.body.userID)
        const userId = (req as any).userID || req.body.userID || 'anonymous';

        // 1. Check if file exists
        if (!file) {
            console.error('[Controller] ❌ No file found in request. Check "file" key in FormData.');
            return res.status(400).send({ success: false, msg: 'No file uploaded' });
        }

        console.log(`[Controller] 📄 File Details: Name=${file.originalname}, Size=${(file.size / 1024 / 1024).toFixed(2)} MB, Mime=${file.mimetype}`);

        // 2. Prepare for S3
        const fileExtension = path.extname(file.originalname);
        // Clean filename: Remove spaces, add timestamp
        const cleanFileName = `${userId}_${Date.now()}${fileExtension}`.replace(/\s+/g, '');

        console.log(`[Controller] 🔄 generated S3 Key: ${cleanFileName}`);

        // 3. Call Service
        // We pass file.mimetype so S3 knows if it's an image or video
        const s3Url = await uploadVideoToS3(file.path, cleanFileName, file.mimetype);

        // 4. Cleanup Local File
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log(`[Controller] 🧹 Local temp file deleted: ${file.path}`);
        }

        // 5. Send Response
        console.log('[Controller] ✅ Sending success response to client');
        console.log('--------------------------------------------------');

        return res.status(200).send({
            success: true,
            url: s3Url,
            msg: 'Asset uploaded successfully'
        });

    } catch (err: any) {
        console.error('[Controller] ❌ Critical Error:', err);

        // Attempt cleanup on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
            console.log('[Controller] 🧹 Local temp file cleaned up after error');
        }

        return res.status(500).send({
            success: false,
            msg: err.message || 'Internal Server Error during upload'
        });
    }
};