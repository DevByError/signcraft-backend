import type { Request, Response, NextFunction } from 'express';
import Route from '../models/management/route';
import Role from '../models/management/role'; // Import Role Model
import routeroleconfig from '../models/management/routeroleconfig';

export default (req: Request, res: Response, next: NextFunction) => {
    // Get the Role Name from the token (decoded in chktoken)
    const roleName = (req as any).userRole;

    // Safety check: If for some reason role is missing
    if (!roleName) {
        return res.status(403).json({
            success: false,
            msg: '403! Forbidden. No role assigned.',
            sts: 'ERROR'
        });
    }

    // Query: Find a config that matches this Route AND matches the Role Name
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
                // ✅ HERE IS THE FIX: We filter by the role name from the token
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