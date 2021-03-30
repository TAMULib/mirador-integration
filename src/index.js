import Mirador from 'mirador/dist/es/src/index';
import { miradorImageToolsPlugin } from 'mirador-image-tools';
import miradorAnnotationPlugins from 'mirador-annotations';
import LocalStorageAdapter from 'mirador-annotations/lib/LocalStorageAdapter';

/** */
class SimpleAnnotationServerV2Adapter {
  /** */
  constructor(canvasId, endpointUrl) {
    this.canvasId = canvasId;
    this.endpointUrl = endpointUrl;
  }

  /** */
  get annotationPageId() {
    return `${this.endpointUrl}/search?uri=${this.canvasId}`;
  }

  /** */
  async create(annotation) {
    return fetch(`${this.endpointUrl}/create`, {
      body: JSON.stringify(SimpleAnnotationServerV2Adapter.createV2Anno(annotation)),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
      .then((response) => this.all())
      .catch(() => this.all());
  }

  /** */
  async update(annotation) {
    return fetch(`${this.endpointUrl}/update`, {
      body: JSON.stringify(SimpleAnnotationServerV2Adapter.createV2Anno(annotation)),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
      .then((response) => this.all())
      .catch(() => this.all());
  }

  /** */
  async delete(annoId) {
    return fetch(`${this.endpointUrl}/destroy?uri=${encodeURIComponent(annoId)}`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
    })
      .then((response) => this.all())
      .catch(() => this.all());
  }

  /** */
  async get(annoId) {
    // SAS does not have GET for a single annotation
    const annotationPage = await this.all();
    if (annotationPage) {
      return annotationPage.items.find((item) => item.id === annoId);
    }
    return null;
  }

  /** Returns an AnnotationPage with all annotations */
  async all() {
    const resp = await fetch(this.annotationPageId);
    const annos = await resp.json();
    return this.createAnnotationPage(annos);
  }

  /** Creates a V2 annotation from a V3 annotation */
  static createV2Anno(v3anno) {
    const v2anno = {
      '@context': 'http://iiif.io/api/presentation/2/context.json',
      '@type': 'oa:Annotation',
      motivation: 'oa:commenting',
      on: {
        '@type': 'oa:SpecificResource',
      },
    };
    // copy id if it is SAS-generated
    if (v3anno.id && v3anno.id.startsWith('http')) {
      v2anno['@id'] = v3anno.id;
    }
    if (Array.isArray(v3anno.body)) {
      v2anno.resource = v3anno.body.map((b) => this.createV2AnnoBody(b));
    } else {
      v2anno.resource = this.createV2AnnoBody(v3anno.body);
    }
    if (v3anno.target.selector) {
      if (Array.isArray(v3anno.target.selector)) {
        const selectors = v3anno.target.selector.map((s) => this.createV2AnnoSelector(s));
        // create choice, assuming two elements and 0 is default
        v2anno.on.selector = {
          '@type': 'oa:Choice',
          default: selectors[0],
          item: selectors[1],
        };
      } else {
        v2anno.on.selector = this.createV2AnnoSelector(v3anno.target.selector);
      }

      if (v3anno.target.source) {
        v2anno.on.full = v3anno.target.source.id ? v3anno.target.source.id : v3anno.target.source;
        if (v3anno.target.source.partOf) {
          v2anno.on.within = {
            '@id': v3anno.target.source.partOf.id 
              ? v3anno.target.source.partOf.id
              : v3anno.target.source.partOf,
            '@type': 'sc:Manifest',
          };
        }
      }
    }
    return v2anno;
  }

  /** */
  static createV2AnnoBody(v3body) {
    const v2body = {
      chars: v3body.value,
    };
    if (v3body.purpose === 'tagging') {
      v2body['@type'] = 'oa:Tag';
    } else {
      v2body['@type'] = 'dctypes:Text';
    }
    if (v3body.format) {
      v2body.format = v3body.format;
    }
    if (v3body.language) {
      v2body.language = v3body.language;
    }
    return v2body;
  }

  /** */
  static createV2AnnoSelector(v3selector) {
    switch (v3selector.type) {
      case 'SvgSelector':
        return {
          '@type': 'oa:SvgSelector',
          value: v3selector.value,
        };
      case 'FragmentSelector':
        return {
          '@type': 'oa:FragmentSelector',
          value: v3selector.value,
        };
      default:
        return null;
    }
  }

  /** Creates an AnnotationPage from a list of V2 annotations */
  createAnnotationPage(v2annos) {
    if (Array.isArray(v2annos)) {
      const v3annos = v2annos.map((a) => SimpleAnnotationServerV2Adapter.createV3Anno(a));
      return {
        id: this.annotationPageId,
        items: v3annos,
        type: 'AnnotationPage',
      };
    }
    return v2annos;
  }

  /** Creates a V3 annotation from a V2 annotation */
  static createV3Anno(v2anno) {
    const v3anno = {
      id: v2anno['@id'],
      motivation: 'commenting',
      type: 'Annotation',
    };
    if (Array.isArray(v2anno.resource)) {
      v3anno.body = v2anno.resource.map((b) => this.createV3AnnoBody(b));
    } else {
      v3anno.body = this.createV3AnnoBody(v2anno.resource);
    }
    let v2target = v2anno.on;
    if (Array.isArray(v2target)) {
      [v2target] = v2target;
    }
    v3anno.target = {
      selector: this.createV3AnnoSelector(v2target.selector),
      source: v2target.full,
    };
    if (v2target.within) {
      v3anno.target.source = {
        id: v2target.full,
        partOf: {
          id: v2target.within['@id'],
          type: 'Manifest',
        },
        type: 'Canvas',
      };
    }
    return v3anno;
  }

  /** */
  static createV3AnnoBody(v2body) {
    const v3body = {
      type: 'TextualBody',
      value: v2body.chars,
    };
    if (v2body.format) {
      v3body.format = v2body.format;
    }
    if (v2body.language) {
      v3body.language = v2body.language;
    }
    if (v2body['@type'] === 'oa:Tag') {
      v3body.purpose = 'tagging';
    }
    return v3body;
  }

  /** */
  static createV3AnnoSelector(v2selector) {
    switch (v2selector['@type']) {
      case 'oa:SvgSelector':
        return {
          type: 'SvgSelector',
          value: v2selector.value,
        };
      case 'oa:FragmentSelector':
        return {
          type: 'FragmentSelector',
          value: v2selector.value,
        };
      case 'oa:Choice':
        /* create alternate selectors */
        return [
          this.createV3AnnoSelector(v2selector.default),
          this.createV3AnnoSelector(v2selector.item),
        ];
      default:
        return null;
    }
  }
}

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
	var var_defaultview = urlParams.get('defaultview');
  } else {
	var var_defaultview = "single";
  }
  
  if (urlParams.has('thumbnailnavigation')) {
	var var_thumbnailnavigation = urlParams.get('thumbnailnavigation');
  } else {
	var var_thumbnailnavigation = "far-bottom";
  }

  if (urlParams.has('selectedtheme')) {
	var var_selectedtheme = urlParams.get('selectedtheme');
  } else {
	var var_selectedtheme = "light";
  }    

	console.log('manifest', var_manifest);
	console.log('canvas', var_canvas);
	console.log('thumbnailnavigation', '(off, far-bottom, far-right) ' + var_thumbnailnavigation);
	console.log('defaultview', '(single, book, gallery) ' + var_defaultview);
	console.log('selectedtheme', '(light, dark) ' + var_selectedtheme);
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
  annotation: {
	//adapter: (canvasId),
  },
  selectedTheme: var_selectedtheme,
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
  ...miradorAnnotationPlugins,
]);
