import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import design from '../models/designing/design';
import { uploadVideoToS3 } from '../utils/s3Service';
import ffmpeg from 'fluent-ffmpeg';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

// GET ALL DESIGNS
export const getalldesigns = (req: Request, res: Response) => {
    design.findAll({ where: { sts: true } }).then((result: any) => {
        if (result) {
            res.status(200).send({ success: true, data: result });
        } else {
            res.status(200).send({ success: false, msg: 'Empty gallery' });
        }
    });
};

// GET DESIGN BY ID
export const getdesignbyid = (req: Request, res: Response) => {
    design.findOne({ where: { id: req.query.id, sts: true } }).then((result: any) => {
        if (result) {
            res.status(200).send({ success: true, data: result });
        } else {
            res.status(200).send({ success: false, msg: 'Design not found' });
        }
    });
};

// CREATE OR UPDATE DESIGN (Name & Content)
export const postsavedesign = (req: Request, res: Response) => {
    // If you are testing WITHOUT chktoken, we need a dummy ID
    // If chktoken is ON, it will use req.body.userID
    const activeUserId = req.body.userID || "00000000-0000-0000-0000-000000000000";

    if (req.body.id) {
        // UPDATE EXISTING
        design.update({
            title: req.body.title,
            canvasData: req.body.canvasData,
            timelineData: req.body.timelineData,
            userId: activeUserId, // ✅ ADD THIS
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
    } else {
        // CREATE NEW
        design.create({
            id: uuidv4(),
            title: req.body.title,
            canvasData: req.body.canvasData,
            timelineData: req.body.timelineData,
            userId: activeUserId, // ✅ ADD THIS (Fixes the SequelizeValidationError)
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

// DELETE DESIGN
export const postdeldesign = (req: Request, res: Response) => {
    design.update({ sts: false }, { where: { id: req.body.id } }).then((result: any) => {
        if (result) {
            res.status(200).send({ success: true, msg: 'Design Deleted' });
        } else {
            res.status(200).send({ success: false, msg: 'Error deleting' });
        }
    });
};


export const postexportvideo = (req: Request, res: Response) => {
    const designId = req.body.id;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const bucketName = process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_REGION;
    const fps = 30;

    design.findOne({ where: { id: designId, sts: true } }).then((designData: any) => {
        if (!designData) {
            res.status(200).send({ success: false, msg: 'Design not found' });
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