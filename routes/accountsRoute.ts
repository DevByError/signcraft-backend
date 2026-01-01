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

// Authentication routes
route.post('/register', expvalidator.registervalidator, accountsController.postregister);
route.get('/login', accountsController.getlogin);
route.post('/login', expvalidator.loginvalidator, accountsController.postlogin);
route.get('/logout', chktoken, accountsController.getlogout);



// Default route
route.get('/', accountsController.getlogin);

export default route;