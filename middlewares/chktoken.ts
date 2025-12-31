import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export default (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.authtoken;

    if (!token) {
        res.status(200).render('accounts/login', { pageTitle: 'LUC Online System || Login Page', msg: 'Session expired. Please login again.', sts: 'ERROR', data: req.body });
    }
    else {
        jwt.verify(token, process.env.token_secret as string, (err: any, decoded: any) => {
            if (err) {
                res.status(200).render('accounts/login', { pageTitle: 'LUC Online System || Login Page', msg: 'Session Validation Failed. Please login again.', sts: 'ERROR', data: req.body });
            }
            else {
                req.body.isLoggedIn = decoded.isLoggedIn;
                req.body.userID = decoded.userId;
                req.body.tenantID = decoded.tenantId;
                req.body.username = decoded.username;
                req.body.role = decoded.role;
                next();
            }
        });
    }
};