import AWS from 'aws-sdk';
import fs from 'fs';

// Configure AWS (Make sure these are in your .env file)
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

export const uploadFileToS3 = async (filePath: string, fileName: string): Promise<string> => {
    const fileContent = fs.readFileSync(filePath);

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME || 'signcraft-assets',
        Key: `exports/${Date.now()}_${fileName}`,
        Body: fileContent,
        ContentType: 'video/mp4',
        ACL: 'public-read' // Make sure your bucket allows public read if you want screens to access it easily
    };

    try {
        const data = await s3.upload(params).promise();
        return data.Location; // Returns the URL of the uploaded video
    } catch (error) {
        console.error("S3 Upload Error:", error);
        throw error;
    }
};