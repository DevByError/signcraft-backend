import express from 'express';

// Import Controllers
import * as designController from '../controllers/designController';
import * as playlistController from '../controllers/playlistController';
import * as screenController from '../controllers/screenController';

// Import Validators
import * as expvalidator from '../validators/expvalidator';

// Import Middlewares
import chktoken from '../middlewares/chktoken';
// import chkrole from '../middlewares/chkrole'; 

const router = express.Router();

// DESIGN ROUTES
router.get('/getalldesigns', designController.getalldesigns);
router.get('/getdesignbyid', designController.getdesignbyid);
router.post('/postsavedesign', expvalidator.savedesignvalidator, designController.postsavedesign);
router.post('/postdeldesign', designController.postdeldesign);
router.post('/postexportvideo', designController.postexportvideo);
// PLAYLIST ROUTES
router.get('/getplaylists', playlistController.getplaylists);
router.get('/getplaylistdetails', playlistController.getplaylistdetails);
router.post('/postsaveplaylist', playlistController.postsaveplaylist);
router.post('/postsyncplaylistitems', playlistController.postsyncplaylistitems);
router.post('/postdelplaylist', playlistController.postdelplaylist); // Added

// SCREEN ROUTES
router.get('/getscreens', screenController.getscreens);
router.get('/getscreenbyid', screenController.getscreenbyid); // Added
router.post('/postscreenupdate', screenController.postscreenupdate);
router.post('/postdelscreen', screenController.postdelscreen);
router.post('/postdeploytoscreen', screenController.postdeploytoscreen); // The "Live" version

export default router;