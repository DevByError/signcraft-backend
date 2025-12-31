import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import moment from 'moment';

import login from '../models/management/login';
import userroleconfig from '../models/management/userroleconfig';
import { v4 as uuidv4 } from 'uuid';

export const getregister = (req: Request, res: Response, next: NextFunction) => {
    res.status(200).render('accounts/register', { pageTitle: 'LUC Online System || Register Page', msg: '', sts: '', data: req.body });
};
export const getlogin = (req: Request, res: Response, next: NextFunction) => {
    res.status(200).render('accounts/login', { pageTitle: 'LUC Online System || Login Page', msg: '', sts: '', data: req.body });
};

export const postregister = async (req: Request, res: Response, next: NextFunction) => {
    const { firstname, lastname, email, password, confirm_password } = req.body
    const hashedPassword = await bcrypt.hash(password, 12);

    // if (req.body) {

    // if (password != confirm_password) {
    //     return res.status(200).send({
    //         data: {
    //             msg: 'password and confirm password do not match'
    //         }
    //     });
    // }

    login.findOne({
        where: {
            username: email,
            sts: true
        }
    }).then((existinguser: any) => {
        if (existinguser) {
            return res.status(200).send({
                data: {
                    msg: 'user already exists'
                }, success: false, err: null
            })
        } else {
            login.create({
                id: uuidv4(),
                tenantid: uuidv4(), // Assuming new user gets a new tenant ID. Change logic if they belong to existing tenant.
                firstname: firstname,
                lastname: lastname,
                username: email, // Mapping email to username field
                password: hashedPassword,
                profilepic: 'default.png', // valid string as per model
                email_validation: false,
                sts: true,
                otp: 0 // Initialize otp
            }).then((newuser: any) => {
                return res.status(200).send({
                    data: {
                        msg: 'user registered successfully',
                        newuser: newuser,
                    }
                })
            })
        }
    });
    // } else {
    //     return res.status(200).send({
    //         data: {
    //             msg: 'invalid data'
    //         }
    //     });
    // }

};


export const postlogin = async (req: Request, res: Response) => {
    try {
        const user: any = await login.findOne({
            where: {
                username: req.body.email,
                sts: true
            }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                data: { msg: 'Invalid Login Details!' }
            });
        }

        const isMatch = await bcrypt.compare(req.body.password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                data: { msg: 'Invalid Login Details!' }
            });
        }

        const roles = await userroleconfig.findAll({
            where: { user_id: user.id, sts: true },
        });

        const allroles = roles.map((r: any) => r.role_id);

        const token = jwt.sign(
            {
                isLoggedIn: true,
                userId: user.id,
                email: user.username,
                username: `${user.firstname} ${user.lastname}`,
                role: allroles
            },
            process.env.token_secret as string,
            { expiresIn: '24h' }
        );

        res.cookie('authtoken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            data: {
                msg: 'Login successful',
                authtoken: token
            }
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            data: { msg: 'Server error' }
        });
    }
};


export const getlogout = (req: Request, res: Response) => {
    res.clearCookie('authtoken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/'
    });

    return res.status(200).render('accounts/login', {
        pageTitle: 'LUC Online System || Login Page',
        msg: 'You have successfully logged out.',
        sts: 'SUCCESS',
        data: {}
    });
};

// exports.getdashboard = (req: Request, res: Response, next: NextFunction) => {
//     company.findAll({
//         where: {
//             tenantid: req.body.tenantID,
//             sts: 1
//         }
//     }).then((comps: any) => {
//         let compcnt = comps.length;

//         ledger.findAll({
//             where: {
//                 tenantid: req.body.tenantID,
//                 sts: 1
//             }
//         }).then((ledgers: any) => {

//             let ledgerscnt = ledgers.length;
//             res.status(200).render('accounts/dashboard', {
//                 pageTitle: 'Dashboard || LUC Online System', pageName: 'Dashboard', msg: '', sts: '', data: {
//                     profile: req.body.profile,
//                     compcnt: compcnt,
//                     ledgerscnt: ledgerscnt,
//                     allmenus: req.body.allmenus
//                 }
//             });
//         })
//     })
// };