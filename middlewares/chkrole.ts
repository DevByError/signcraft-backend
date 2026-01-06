import type { Request, Response, NextFunction } from 'express';
import Route from '../models/management/route';
import Role from '../models/management/role'; // 
import routeroleconfig from '../models/management/routeroleconfig';

export default (req: Request, res: Response, next: NextFunction) => {

    const roleName = (req as any).userRole;

    if (!roleName) {
        return res.status(403).json({
            success: false,
            msg: '403! Forbidden. No role assigned.',
            sts: 'ERROR'
        });
    }


    routeroleconfig.findAll({
        include: [
            {
                model: Route,
                where: {
                    route: req.originalUrl.split("?").shift(),
                    method: req.method
                },
                required: true
            },
            {
                model: Role,
                // the role name from the token
                where: { rolename: roleName },
                required: true
            }
        ]
    }).then((result: any) => {
        if (result.length > 0) {
            // Permission Found
            next();
        } else {
            // Permission Not Found -> 403 JSON Error
            console.warn(`[AUTH] 403 Access Denied for User Role: ${roleName} on ${req.originalUrl}`);

            return res.status(403).json({
                success: false,
                msg: '403! Unauthorized Access. You do not have permission.',
                sts: 'ERROR'
            });
        }
    }).catch((err) => {
        console.error("Check Role Error:", err);
        return res.status(500).json({ success: false, msg: 'Internal Server Error checking roles' });
    });
};