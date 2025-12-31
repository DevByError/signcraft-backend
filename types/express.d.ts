import * as express from 'express';

declare global {
    namespace Express {
        interface Request {
            body: {
                // Auth & Session (
                isLoggedIn?: boolean;
                userID?: string;
                tenantID?: string;
                username?: string;
                role?: string;

                // UI & Layout (From our menus/profile middlewares)
                allmenus?: any[];
                profile?: {
                    tenantname: string;
                    logo: string;
                    favicon: string;
                    systemicon: string;
                    tenantsname: string;
                    cprighttxt: string;
                    cprighturl: string;
                    href: string;
                };

                // SignCraft Specific Fields
                designData?: any;      // For when you load a Canva JSON from DB
                timelineData?: any;    // For your CapCut partitions
                screenId?: string;     // For screen management logic

                // Allow for any other dynamic fields we use in our if-else logic
                [key: string]: any;
            };

            // If we decide to put custom data directly on Request object
            location?: string;
            filename?: string;
        }
    }
}