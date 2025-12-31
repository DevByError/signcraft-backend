import type { Request, Response, NextFunction } from 'express';
import Route from '../models/management/route';
import routeroleconfig from '../models/management/routeroleconfig';

export default (req: Request, res: Response, next: NextFunction) => {
    routeroleconfig.findAll({
        where: { role_id: req.body.role },
        include: [{
            model: Route,
            where: { route: req.originalUrl.split("?").shift(), method: req.method },
            required: true
        }]
    }).then((result: any) => {
        if (result.length > 0) {
            next();
        } else {

            // here we should render our pages
            res.status(200).render('accounts/login', {
                pageTitle: 'LUC Online System || Login Page',
                msg: '403! Unauthorized Access.',
                sts: 'ERROR',
                data: req.body
            });
        }
    });
};

