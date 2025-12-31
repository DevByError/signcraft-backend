import type { Request, Response, NextFunction } from 'express';
import Sequelize from 'sequelize';
import menu from '../models/management/menu';
import menuroleconfig from '../models/management/menuroleconfig';

export default (req: Request, res: Response, next: NextFunction) => {

    menuroleconfig.findAll({
        where: {
            role_id: req.body.role,
        },
        include: [{ model: menu, where: { parent_id: null }, required: true }],
        order: [
            [Sequelize.fn('length', Sequelize.col('tblmenu.slno')), 'ASC'],
            [menu, 'slno', 'ASC']
        ]
    }).then((items: any) => {

        let allmenus = items.map((element: any) => {

            if (element.tblmenu.href == req.originalUrl) {
                return {
                    slno: element.tblmenu.slno,
                    menuname: element.tblmenu.menuname,
                    iclass: element.tblmenu.iclass,
                    menuclass: element.tblmenu.menuclass + ' active',
                    href: element.tblmenu.href
                }
            }
            else {
                return {
                    slno: element.tblmenu.slno,
                    menuname: element.tblmenu.menuname,
                    iclass: element.tblmenu.iclass,
                    menuclass: element.tblmenu.menuclass,
                    href: element.tblmenu.href
                }
            }
        });

        // this is to secure no duplicate menu items are getting in the view
        var allmenusclean = allmenus.filter((arr: any, index: number, self: any[]) =>
            index === self.findIndex((t: any) => (t.menuname === arr.menuname && t.href === arr.href))
        )

        req.body.allmenus = allmenusclean;
        next();
    });
}