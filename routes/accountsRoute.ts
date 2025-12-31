import express from 'express';
import path from 'path';

// Import Controller (Named exports)
import * as accountsController from '../controllers/accountsController';

// Import Middlewares (Default exports)
import chktoken from '../middlewares/chktoken';
import chkrole from '../middlewares/chkrole';
import menus from '../middlewares/menus';
import profile from '../middlewares/profile';

// Import Validator (Named exports)
import * as expvalidator from "../validators/expvalidator";

const route = express.Router();

// route.get('/register', accountsController.getregister);
// route.post('/register', expvalidator.registervalidator, accountsController.postregister);

route.get('/login', accountsController.getlogin);

route.post('/login', expvalidator.loginvalidator, accountsController.postlogin);

route.get('/register', accountsController.getregister);
route.post('/register', expvalidator.registervalidator, accountsController.postregister);

// route.get('/logout', accountsController.getlogout);

// route.get('/passwordreset', accountsController.getpasswordreset);
// route.post('/passwordreset', expvalidator.passwordresetvalidator, accountsController.postpasswordreset);
// route.get('/passwordrecovery', accountsController.getpasswordrecovery);
// route.post('/passwordrecovery', expvalidator.passwordrecoveryvalidator, accountsController.postpasswordrecovery);

// route.get('/dashboard', chktoken, chkrole, menus, profile, accountsController.getdashboard);

// route.get('/managerdash', isAuth, isAuthorize, sessionlocale, accountsController.getmanagerdash);

route.get('/', accountsController.getlogin);

export default route;