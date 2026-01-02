// middleware/chktoken.ts
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export default (req: Request, res: Response, next: NextFunction) => {
    const token =
        req.cookies?.authtoken ||
        req.headers.authorization?.split(' ')[1];

    if (!token) {
        // MUST return 401
        return res.status(401).json({ success: false, msg: 'Token missing or expired' });
    }

    jwt.verify(token, process.env.token_secret as string, (err: any, decoded: any) => {
        if (err) {
            // MUST return 401
            return res.status(401).json({ success: false, msg: 'Invalid or expired token' });
        }

        (req as any).userID = decoded.userId;
        (req as any).userRole = decoded.role;
        next();
    });
};