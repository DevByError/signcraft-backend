import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const s3Client = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY as string,
        secretAccessKey: process.env.AWS_SECRET_KEY as string,
    },
});

export const uploadVideoToS3 = (filePath: string, fileName: string) => {
    const fileStream = fs.createReadStream(filePath);
    const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME as string,
        Key: `outputs/${fileName}`, // Organized folder in S3
        Body: fileStream,
        ContentType: "video/mp4",
        ACL: "public-read" as any, // Crucial for Flutter to play it
    };

    return s3Client.send(new PutObjectCommand(uploadParams));
};