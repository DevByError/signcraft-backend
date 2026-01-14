import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import moment from 'moment';

import login from '../models/management/login';
import userroleconfig from '../models/management/userroleconfig';
import { v4 as uuidv4 } from 'uuid';
import role from '../models/management/role';

// export const getregister = (req: Request, res: Response, next: NextFunction) => {
//     res.status(200).render('accounts/register', { pageTitle: 'LUC Online System || Register Page', msg: '', sts: '', data: req.body });
// };
// export const getlogin = (req: Request, res: Response, next: NextFunction) => {
//     res.status(200).render('accounts/login', { pageTitle: 'LUC Online System || Login Page', msg: '', sts: '', data: req.body });
// };

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
        console.log('🔐 [LOGIN] Login attempt for:', req.body.email);

        const user = await login.findOne({
            where: {
                username: req.body.email,
                sts: true
            }
        });

        if (!user) {
            console.log('❌ [LOGIN] User not found:', req.body.email);
            return res.status(401).json({
                success: false,
                data: { msg: 'Invalid Login Details!' }
            });
        }

        const isMatch = await bcrypt.compare(req.body.password, (user as any).password);
        if (!isMatch) {
            console.log('❌ [LOGIN] Invalid password for:', req.body.email);
            return res.status(401).json({
                success: false,
                data: { msg: 'Invalid Login Details!' }
            });
        }

        const roles = await userroleconfig.findOne({
            where: { user_id: (user as any).id, sts: true },
            include: [
                {
                    model: role,
                    attributes: ['rolename']
                }
            ]
        });

        const rolename: string = roles && roles.getDataValue('tblrole')
            ? roles.getDataValue('tblrole').rolename.toLowerCase()
            : 'designer';

        const token = jwt.sign(
            {
                isLoggedIn: true,
                userId: (user as any).id,
                email: (user as any).username,
                username: `${(user as any).firstname} ${(user as any).lastname}`,
                role: rolename
            },
            process.env.token_secret as string,
            { expiresIn: '24h' }
        );

        res.cookie('authtoken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000
        });

        console.log('✅ [LOGIN] Login successful for:', (user as any).username, '| Role:', rolename);

        return res.status(200).json({
            success: true,
            data: {
                msg: 'Login successful',
                authtoken: token,
            }
        });

    } catch (error: any) {
        console.error('❌ [LOGIN] Error during login:', error);
        return res.status(500).json({
            success: false,
            data: { msg: 'An error occurred during login. Please try again.' }
        });
    }
};



export const getlogout = (req: Request, res: Response) => {
    // 1. Clear the HTTP-only cookie
    res.clearCookie('authtoken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Ensure true in HTTPS
        sameSite: 'strict', // Protects against CSRF
        path: '/'
    });

    // 2. Return JSON response for the React Frontend to handle
    return res.status(200).json({
        success: true,
        msg: 'You have successfully logged out.'
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



export const getProfile = async (req: Request, res: Response) => {
    const userId = (req as any).userID;

    if (!userId) return res.status(401).send({ success: false, msg: 'Unauthorized' });

    try {
        const user = await login.findOne({
            where: { id: userId },
            attributes: ['id', 'username', 'firstname', 'lastname'], // Fetch 'username' as email
            include: [{
                model: userroleconfig,
                include: [{
                    model: role,
                    attributes: ['rolename'] // Assuming column is 'rolename' or 'name'
                }]
            }]
        });

        if (user) {
            const u = user as any;

            // Logic to extract the role string from the nested arrays
            let userRole = 'designer'; // Default fallback

            // Check if user has roles
            if (u.tbluserroleconfigs && u.tbluserroleconfigs.length > 0) {
                // Get the first role assigned
                const roleObj = u.tbluserroleconfigs[0].tblrole;
                if (roleObj) {
                    // Handle case sensitivity or column naming differences
                    userRole = roleObj.rolename || roleObj.name || roleObj.RoleName || 'designer';
                }
            }

            res.status(200).send({
                success: true,
                data: {
                    userId: u.id,

                    // 1. Map DB 'username' to Frontend 'email'
                    email: u.username,

                    // 2. Combine names
                    username: `${u.firstname} ${u.lastname}`,

                    // 3. The actual role from DB
                    role: userRole
                }
            });
        } else {
            res.status(404).send({ success: false, msg: 'User not found' });
        }
    } catch (err: any) {
        console.error("Profile Error:", err);
        res.status(500).send({ success: false, msg: 'Server Error' });
    }
};