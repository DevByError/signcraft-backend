// // middleware/chktoken.ts
// import type { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';

// export default (req: Request, res: Response, next: NextFunction) => {
//     const token =
//         req.cookies?.authtoken ||
//         req.headers.authorization?.split(' ')[1];

//     if (!token) {
//         // MUST return 401
//         return res.status(401).json({ success: false, msg: 'Token missing or expired' });
//     }

//     jwt.verify(token, process.env.token_secret as string, (err: any, decoded: any) => {
//         if (err) {
//             // MUST return 401
//             return res.status(401).json({ success: false, msg: 'Invalid or expired token' });
//         }

//         (req as any).userID = decoded.userId;
//         (req as any).userRole = decoded.role;
//         next();
//     });
// };

// src/middlewares/chktoken.ts
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
    // Ensure this matches the secret used in your login controller
    const secret = process.env.token_secret || 'secret_key';

    jwt.verify(token, secret, (err: any, decoded: any) => {
        if (err) {
            return res.status(401).json({ success: false, msg: 'Invalid or expired token' });
        }

        // ---------------------------------------------------------
        // ✅ 3. ATTACH DATA TO REQUEST (CRITICAL FOR CONTROLLERS & ROLES)
        // ---------------------------------------------------------

        // A. Standard Object (Best practice for controllers)
        (req as any).user = decoded;

        // B. Specific properties (Required for your chkrole middleware)
        (req as any).userID = decoded.userId || decoded.id; // For DB queries
        (req as any).userRole = decoded.role; // <--- RESTORED THIS for chkrole

        next();
    });
};