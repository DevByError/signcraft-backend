import express from 'express';

// Import Controllers
import * as designController from '../controllers/designController';
import * as playlistController from '../controllers/playlistController';
import * as screenController from '../controllers/screenController';

// Import Validators
import * as expvalidator from '../validators/expvalidator';

// Import Middlewares
import chktoken from '../middlewares/chktoken';
import { check } from 'express-validator';
import chkrole from '../middlewares/chkrole';

const router = express.Router();

// DESIGN ROUTES (protected with token verification)
router.get('/getalldesigns', chktoken, designController.getalldesigns);
router.get('/getdesignbyid', chktoken, designController.getdesignbyid);
router.post('/postsavedesign', chktoken, expvalidator.savedesignvalidator, designController.postsavedesign);
// router.post('/postdeldesign', designController.postdeldesign);
router.post('/postdeldesign', chktoken, chkrole, designController.postdeldesign);

router.post('/postuploadasset', designController.uploadMiddleware, designController.postuploadasset);


router.post('/exportvideo', chktoken, designController.postexportvideo);
// PLAYLIST ROUTES (protected with token verification)
router.get('/getplaylists', chktoken, playlistController.getplaylists);
router.get('/getplaylistdetails', chktoken, playlistController.getplaylistdetails);
router.post('/saveplaylist', chktoken, playlistController.postsaveplaylist);
router.post('/syncplaylistitems', chktoken, playlistController.postsyncplaylistitems);
router.post('/delplaylist', chktoken, playlistController.postdelplaylist); // Added

// SCREEN ROUTES
router.get('/getscreens', screenController.getscreens);
router.get('/getscreenbyid', screenController.getscreenbyid); // Added
router.post('/screensupdate', screenController.postscreenupdate);
router.post('/delscreen', screenController.postdelscreen);
router.post('/deploytoscreen', screenController.postdeploytoscreen); // The "Live" version

export default router;