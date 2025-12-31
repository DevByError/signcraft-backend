import { check, validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';


export const registervalidator = [
    check('firstname')
        .notEmpty().withMessage('First name cannot be blank'),

    check('lastname')
        .notEmpty().withMessage('Last name cannot be blank'),

    check('email')
        .notEmpty().withMessage('Email cannot be blank')
        .isEmail().withMessage('Email format is invalid'),

    check('password')
        .notEmpty().withMessage('Password cannot be blank')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

    check('confirm_password')
        .notEmpty().withMessage('Confirm password cannot be blank')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password and confirm password do not match');
            }
            return true;
        }),

    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            const messages = errors.array().map(err => err.msg);

            return res.status(200).json({
                success: false,
                data: {
                    msg: messages
                },
                err: null
            });
        }

        next();
    }
];

export const loginvalidator = [
    check('email')
        .notEmpty().withMessage('Email cannot be blank')
        .isEmail().withMessage('Email format is invalid'),

    check('password')
        .notEmpty().withMessage('Password cannot be blank'),

    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            const messages = errors.array().map(err => err.msg);

            return res.status(200).json({
                success: false,
                data: {
                    msg: messages
                },
                err: null
            });
        }

        next();
    }
];


export const savedesignvalidator = [
    check('title')
        .notEmpty().withMessage('Design title cannot be blank'),

    check('canvasData')
        .notEmpty().withMessage('Canvas element data is required'),

    check('timelineData')
        .notEmpty().withMessage('Timeline and animation data is required'),

    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {

            let allmsg: string[] = [];

            errors.array().forEach((val: any, i: number) => {
                if (i == errors.array().length - 1) {
                    allmsg.push(val.msg + ".");
                }
                else {
                    allmsg.push(val.msg + ",<br />");
                }
            });

            return res.status(200).send({
                data: {
                    msg: allmsg,
                },
                success: false,
                err: null
            });
        } else {
            next();
        }
    }
];

// export const testing = [
//     check('deptname').notEmpty().withMessage('Department name cannot be blank'),
//     check('deptcode').notEmpty().withMessage('Department code cannot be blank'),
//     check('hodname').notEmpty().withMessage('HOD name cannot be blank'),
//     check('hodemail').notEmpty().withMessage('HOD E-mail cannot be blank').isEmail().withMessage('HOD E-mail format wrong'),
//     check('deptdesc').notEmpty().withMessage('Description cannot be blank'),
//     (req: Request, res: Response, next: NextFunction) => {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {

//             let allmsg: string[] = [];

//             errors.array().forEach((val: any, i: number) => {
//                 if (i == errors.array().length - 1) {
//                     allmsg.push(val.msg + ".");
//                 }
//                 else {
//                     allmsg.push(val.msg + ",<br />");
//                 }
//             });

//             return res.status(200).send({
//                 data: {
//                     msg: allmsg,
//                 },
//                 success: false,
//                 err: null
//             });
//         } else {
//             next();
//         }
//     }
// ];