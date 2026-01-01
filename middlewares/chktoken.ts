import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request to include auth properties
declare global {
    namespace Express {
        interface Request {
            body: any;
            isLoggedIn?: boolean;
            userID?: string;
            tenantID?: string;
            username?: string;
            role?: string;
        }
    }
}

export default (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.authtoken;

    if (!token) {
        // Check if this is an API request
        if (req.path.startsWith('/design') || req.path.startsWith('/api')) {
            return res.status(401).json({ success: false, msg: 'Session expired. Please login again.' });
        }
        return res.status(200).render('accounts/login', { pageTitle: 'LUC Online System || Login Page', msg: 'Session expired. Please login again.', sts: 'ERROR', data: req.body || {} });
    }
    else {
        jwt.verify(token, process.env.token_secret as string, (err: any, decoded: any) => {
            if (err) {
                // Check if this is an API request
                if (req.path.startsWith('/design') || req.path.startsWith('/api')) {
                    return res.status(401).json({ success: false, msg: 'Session Validation Failed. Please login again.' });
                }
                return res.status(200).render('accounts/login', { pageTitle: 'LUC Online System || Login Page', msg: 'Session Validation Failed. Please login again.', sts: 'ERROR', data: req.body || {} });
            }
            else {
                // Initialize req.body if it doesn't exist (for GET requests)
                if (!req.body) {
                    req.body = {};
                }
                
                // Assign decoded JWT claims to req.body
                req.body.isLoggedIn = decoded.isLoggedIn;
                req.body.userID = decoded.userId;
                req.body.tenantID = decoded.tenantId;
                req.body.username = decoded.username;
                req.body.role = decoded.role;
                
                // Also assign to req object directly for API routes
                (req as any).isLoggedIn = decoded.isLoggedIn;
                (req as any).userID = decoded.userId;
                (req as any).tenantID = decoded.tenantId;
                (req as any).username = decoded.username;
                (req as any).role = decoded.role;
                
                next();
            }
        });
    }
};