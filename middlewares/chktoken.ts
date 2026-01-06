import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export default (req: Request, res: Response, next: NextFunction) => {
    // 1. Extract Token from Cookie OR Header
    const token =
        req.cookies?.authtoken ||
        (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
        return res.status(401).json({ success: false, msg: 'Access Denied: Token missing' });
    }

    // 2. Verify Token

    const secret = process.env.token_secret || 'secret_key';

    jwt.verify(token, secret, (err: any, decoded: any) => {
        if (err) {
            return res.status(401).json({ success: false, msg: 'Invalid or expired token' });
        }

        //  ATTACH DATA TO REQUEST 


        // A. Standard Object (Best practice for controllers)
        (req as any).user = decoded;

        // B. Specific properties (Required for our chkrole middleware)
        (req as any).userID = decoded.userId || decoded.id; // For DB queries
        (req as any).userRole = decoded.role; // <--- RESTORED THIS for chkrole

        next();
    });
};