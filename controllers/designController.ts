import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import design from '../models/designing/design';
import { uploadVideoToS3 } from '../utils/s3Service';
import ffmpeg from 'fluent-ffmpeg';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import playlistItem from '../models/designing/playlistItem';

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
export const postsavedesign = (req: Request, res: Response) => {
    // Get userId from middleware (set by chktoken) - this is the source of truth
    const activeUserId = (req as any).userID || req.body?.userID;

    if (!activeUserId) {
        return res.status(401).send({ success: false, msg: 'Unauthorized: User ID not found' });
    }

    if (req.body.id) {
        // UPDATE EXISTING - verify ownership first
        design.findOne({ where: { id: req.body.id, userId: activeUserId } }).then((existingDesign: any) => {
            if (!existingDesign) {
                return res.status(403).send({ success: false, msg: 'Design not found or access denied' });
            }
            
            design.update({
                title: req.body.title,
                canvasData: req.body.canvasData,
                timelineData: req.body.timelineData,
                userId: activeUserId,
                UpdatedBy: activeUserId
            }, { where: { id: req.body.id } }).then((result: any) => {
                res.status(200).send({
                    success: true,
                    msg: 'Design Updated',
                    data: { id: req.body.id }
                });
            }).catch(err => {
                console.error(err);
                res.status(500).send({ success: false, msg: "Update failed" });
            });
        }).catch(err => {
            console.error(err);
            res.status(500).send({ success: false, msg: "Verification failed" });
        });
    } else {
        // CREATE NEW
        design.create({
            id: uuidv4(),
            title: req.body.title,
            canvasData: req.body.canvasData,
            timelineData: req.body.timelineData,
            userId: activeUserId,
            CreatedBy: activeUserId,
            sts: true
        }).then((result: any) => {
            res.status(200).send({ success: true, data: result });
        }).catch(err => {
            console.error(err);
            res.status(500).send({ success: false, msg: "Creation failed" });
        });
    }
};

export const postdeldesign = async (req: Request, res: Response) => {
  try {
    // Get designId from multiple sources (consistent with other endpoints)
    const designId =
      req.params.designId ||
      req.body?.designId ||
      req.body?.id;

    // Get userId from middleware (set by chktoken) - with fallback to body
    const userId = (req as any).userID || req.body?.userID;

    console.log('🗑️ [DELETE_DESIGN] Request received:', { designId, userId, hasToken: !!req.cookies?.authtoken });

    if (!designId) {
      console.log('❌ [DELETE_DESIGN] Missing designId');
      return res.status(400).json({
        success: false,
        msg: 'designId is required',
      });
    }

    if (!userId) {
      console.log('❌ [DELETE_DESIGN] Missing userId - token might be invalid or expired');
      return res.status(401).json({
        success: false,
        msg: 'Unauthorized: User ID not found',
      });
    }

    // Verify design exists and belongs to user before deleting
    const designExists = await design.findOne({
      where: { id: designId, userId: userId, sts: true }
    });

    console.log('🔍 [DELETE_DESIGN] Design lookup result:', { found: !!designExists, designId, userId });

    if (!designExists) {
      console.log('❌ [DELETE_DESIGN] Design not found for user or already deleted');
      return res.status(404).json({
        success: false,
        msg: 'Design not found or access denied',
      });
    }

    // 1️⃣ Remove playlist links first
    await playlistItem.destroy({
      where: { designId },
    });

    // 2️⃣ Delete design
    const result = await design.destroy({
      where: { id: designId, userId },
    });

    console.log('✅ [DELETE_DESIGN] Design deleted successfully:', { designId, rowsDeleted: result });

    res.status(200).json({
      success: true,
      msg: 'Design deleted successfully',
    });
  } catch (err) {
    console.error('❌ [DELETE_DESIGN] Error:', err);
    res.status(500).json({
      success: false,
      msg: 'Internal server error',
    });
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