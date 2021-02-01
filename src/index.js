import Mirador from 'mirador/dist/es/src/index';
import { miradorImageToolsPlugin } from 'mirador-image-tools';

// grab the manifest URL if passed - DCH
// https://github.com/ProjectMirador/mirador/blob/master/src/config/settings.js

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

  if (urlParams.has('manifest')) {
    var var_manifest = urlParams.get('manifest');
  } else {
	var var_manifest = "";	  
  }

  if (urlParams.has('canvas')) {
    var var_canvas = urlParams.get('canvas').split(' ').join('%20');
  } else {
	var var_canvas = "";
  }

  if (urlParams.has('defaultview')) {
	var var_defaultview = urlParams.get('defaultView');
  } else {
	var var_defaultview = "single";
  }
  
  if (urlParams.has('thumbnailnavigation')) {
	var var_thumbnailnavigation = urlParams.get('thumbnailnavigation');
  } else {
	var var_thumbnailnavigation = "far-bottom";
  }  

	console.log('manifest', var_manifest);
	console.log('canvas', var_canvas);
	console.log('thumbnailnavigation', '(off, far-bottom, far-right) ' + var_thumbnailnavigation);
	console.log('defaultview', '(single, book, gallery) ' + var_defaultview);

//

const config = {
  id: 'tamu_mirador',
  windows: [{
    imageToolsEnabled: true,
    imageToolsOpen: true,
    defaultView: var_defaultview,
    manifestId: var_manifest,
	canvasId: var_canvas,
  }],
  theme: {
    palette: {
      primary: {
        main: '#1967d2',
      },
    },
  },
  thumbnailNavigation: {
    defaultPosition: var_thumbnailnavigation, // Which position for the thumbnail navigation to be be displayed. Other possible values are "far-bottom" or "far-right"
    displaySettings: true, // Display the settings for this in WindowTopMenu
    height: 130, // height of entire ThumbnailNavigation area when position is "far-bottom"
    width: 100, // width of one canvas (doubled for book view) in ThumbnailNavigation area when position is "far-right"
  },  
};

Mirador.viewer(config, [
  ...miradorImageToolsPlugin,
]);