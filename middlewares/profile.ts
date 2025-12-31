import type { Request, Response, NextFunction } from 'express';
import profile from '../models/management/profile';

export default (req: Request, res: Response, next: NextFunction) => {

    profile.findAll({ where: { tenantid: req.body.tenantID } }).then((result: any) => {
        req.body.profile = {
            tenantname: result[0].dataValues.tenantname,
            logo: result[0].dataValues.logo,
            favicon: result[0].dataValues.favicon,
            systemicon: result[0].dataValues.systemicon,
            tenantsname: result[0].dataValues.tenantsname,
            cprighttxt: result[0].dataValues.cprighttxt,
            cprighturl: result[0].dataValues.cprighturl,
            href: result[0].href
        };
        next();
    });

};

