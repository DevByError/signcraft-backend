import { S3Client, PutObjectCommand, ListBucketsCommand } from "@aws-sdk/client-s3";
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY as string,
        secretAccessKey: process.env.AWS_SECRET_KEY as string,
    },
    // Add timeout to prevent infinite hanging
    requestHandler: {
        connectionTimeout: 5000,
        socketTimeout: 5000,
    } as any
});

// Connectivity Check
(async () => {
    try {
        console.log(`[S3 Init] 📡 Testing connection to AWS...`);
        await s3Client.send(new ListBucketsCommand({}));
        console.log(`[S3 Init] ✅ Connection Verified!`);
    } catch (err: any) {
        console.error(`[S3 Init] ❌ Connection Failed!`, err);
    }
})();

export const uploadVideoToS3 = async (filePath: string, fileName: string, mimeType: string = 'video/mp4'): Promise<string> => {
    console.log(`[S3 Service] 🚀 Starting upload for: ${fileName}`);

    try {
        // --- FIX: Use readFile (Buffer) instead of Stream ---
        // This is much more stable for small/medium files
        const fileContent = fs.readFileSync(filePath);
        console.log(`[S3 Service] 📦 File loaded into memory (${fileContent.length} bytes)`);

        const bucketName = process.env.AWS_BUCKET_NAME as string;
        const region = process.env.AWS_REGION as string;
        const key = `uploads/${fileName}`;

        const uploadParams = {
            Bucket: bucketName,
            Key: key,
            Body: fileContent, // Uploading Buffer
            ContentType: mimeType,
            // ContentLength is automatic for Buffers
        };

        console.log(`[S3 Service] 📡 Uploading Buffer to S3...`);

        await s3Client.send(new PutObjectCommand(uploadParams));

        const objectUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
        console.log(`[S3 Service] ✅ Upload Complete! URL: ${objectUrl}`);

        return objectUrl;

    } catch (error) {
        console.error(`[S3 Service] ❌ Upload Failed:`, error);
        throw error;
    }
};