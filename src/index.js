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
    manifestId: urlParams.get('manifest'),
  }],
  theme: {
    palette: {
      primary: {
        main: '#1967d2',
      },
    },
  },
};

Mirador.viewer(config, [
  ...miradorImageToolsPlugin,
]);