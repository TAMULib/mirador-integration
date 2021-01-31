import Mirador from 'mirador/dist/es/src/index';
import { miradorImageToolsPlugin } from 'mirador-image-tools';

// grab the manifest URL if passed - DCH
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
//

const config = {
  id: 'tamu_mirador',
  windows: [{
    imageToolsEnabled: true,
    imageToolsOpen: true,
    defaultView: 'single',
    manifestId: urlParams.get('manifest'),
  }],
  theme: {
    palette: {
      primary: {
        main: '#1967d2',
      },
    },
  },
  thumbnailNavigation: {
    defaultPosition: 'far-bottom', // Which position for the thumbnail navigation to be be displayed. Other possible values are "far-bottom" or "far-right"
    displaySettings: true, // Display the settings for this in WindowTopMenu
    height: 130, // height of entire ThumbnailNavigation area when position is "far-bottom"
    width: 100, // width of one canvas (doubled for book view) in ThumbnailNavigation area when position is "far-right"
  },  
};

Mirador.viewer(config, [
  ...miradorImageToolsPlugin,
]);