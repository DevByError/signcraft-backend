import express from 'express';
import path from 'path';

// Import controllers and middlewares
// Note: We use * as ... for controllers to get all exported functions

import chktoken from '../middlewares/chktoken';
import chkrole from '../middlewares/chkrole';
import profile from '../middlewares/profile';
import menus from '../middlewares/menus';
import * as expvalidator from '../validators/expvalidator';

const route = express.Router();


// router.get('/filedownload', chktoken, generalController.getfiledownload);  -- we don't have this 

// Change module.exports to export default
export default route;