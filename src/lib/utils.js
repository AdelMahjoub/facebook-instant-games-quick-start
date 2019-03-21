export let devConsole = {
  /**
   * 
   * @param {...any} any 
   */
  log(...args) {
    if (__DEV__) {
      console.log(...args);
    }
  },
  /**
   * 
   * @param  {...any} args 
   */
  warn(...args) {
    if (__DEV__) {
      console.warn(...args)
    }
  }
}

export let assets = {
  // Props to help track the assets being loaded
  toLoad: 0,
  loaded: 0,
  // File extensions for different types of assets
  imageExtensions: ['png', 'jpg', 'gif'],
  fontExtensions: ['ttf', 'otf', 'ttc', 'woff'],
  jsonExtensions: ['json'],
  audioExtensions: ['mp3', 'ogg', 'wav', 'webm'],

  /**
   * The `load` method creates and loads all the assets. 
   * Use it like this: `assets.load(['images/anyImage.png', 'fonts/anyFont.png]);`
   * @param {string[]} sources 
   */
  load(sources) {

    // The `load` method will return a Promise when everything has loaded
    return new Promise((resolve, reject) => {

      // The `loadHandler` counts the number of assets loaded, compares
      // it to the total number of assets that need to be loaded, and
      // resolve the Promise when everything has loaded
      let loadHandler = (e) => {
        // Event's type, either load for success or error for failure
        let eType = e.type;
        // The resource uri 
        let currentSrc = e.path[0].currentSrc;
        // Increment the loaded assets counter whether the load is
        // successful or not
        this.loaded += 1;
        let progress = (this.loaded / this.toLoad) * 100;

        // Console feedbacks, only on dev mode
        if (eType === 'load') {
          devConsole.log(`[${this.loaded}]: ${currentSrc} loaded with success.`)
        } else if (eType === 'error') {
          devConsole.warn(`[${this.loaded}]: Unable to load ${currentSrc}`)
        }

        // Inform the fb instant game sdk of the load progress
        FBInstant.setLoadingProgress(progress);

        // Check wether everything has loaded
        if (this.loaded === this.toLoad) {

          // Reset `toLoad` and `loaded` to `0` so you can use them
          // to load more assets later if you need
          this.toLoad = 0;
          this.loaded = 0;
          devConsole.log('Assets finished loading');
          // Resolve the Promise
          resolve();
        }
      }

      // Display a console message to confirm that assets are
      // being loaded
      devConsole.log('Loading assets...');

      // Find the number of files that need to be loaded
      this.toLoad = sources.length;

      // Loop through all source filenames and find out how
      // they should be interpreted
      for (let i = 0; i < sources.length; i++) {
        let source = sources[i];
        // Find the extension of the asset
        let extension = source.split('.').pop();

        // Load images that have file extension that mach
        // the imageExtensions array
        if (this.imageExtensions.indexOf(extension) !== -1) {
          this.loadImage(source, loadHandler);
        }

        // Load fonts
        else if (this.fontExtensions.indexOf(extension) !== -1) {
          this.loadFont(source, loadHandler);
        }

        // Load JSON files
        else if (this.jsonExtensions.indexOf(extension) !== -1) {
          this.loadJson(source, loadHandler);
        }

        // Load audio files
        else if (this.audioExtensions.indexOf(extension) !== -1) {
          this.loadSound(source, loadHandler);
        }

        // Reject if a file type isn't recognized
        else {
          devConsole.warn(`File type not recognized: ${source}`);
          loadHandler({
            type: 'error',
            path: [{ currentSrc: source }]
          });
        }
      }
    });
  },
  /**
   * 
   * @param {string} source 
   * @param {Function} loadHandler 
   */
  loadImage(source, loadHandler) {
    // Create a new image and call `loadHandler` when the image
    // file has loaded
    let image = new Image();
    image.addEventListener('load', loadHandler, false);
    image.addEventListener('error', loadHandler, false);

    // Assign the image as a property of the `assets` object so
    // you can access it like this: `assets['path/imagename.png']`
    this[source] = image;

    // Set the image's `src` property to start loading the image
    image.src = source;
  },
  /**
   * 
   * @param {string} source 
   * @param {Function} loadHandler 
   */
  loadFont(source, loadHandler) {
    // Use the font's filename as the font family name
    let fontFamily = source.split('/').pop().split('.')[0];

    // Append a `@font-face` style rule to the head of the HTML document
    let newStyle = document.createElement('style');
    let fontFace = `@font-face {
      font-family: ${fontFamily};
      src: url(${source});
    }`;
    newStyle.appendChild(document.createTextNode(fontFace));
    document.head.appendChild(newStyle);

    // Tell the `loadHandler` we are loading a font
    loadHandler({
      type: 'load',
      path: [{ currentSrc: source }]
    });
  },
  /**
   * 
   * @param {string} source 
   * @param {Function} loadHandler 
   */
  loadSound(source, loadHandler) {
    loadHandler({
      type: 'error',
      path: [{ currentSrc: `//TODO: Implement sound loader\n${source}` }]
    });
  },
  /**
   * 
   * @param {string} source 
   * @param {Function} loadHandler 
   */
  loadJson(source, loadHandler) {
    // Create a new `xhr` object and an object to store the file
    let xhr = new XMLHttpRequest();

    // Use xhr to load the JSON file
    xhr.open('GET', source, true);

    // Tell xhr that it is a text file
    xhr.responseType = 'text';

    // Create an onload callback function that 
    // will handle the file loading
    xhr.onload = event => {

      // Check to make sure the file has loaded properly
      const status = xhr.status;
      if (status >= 200 && status < 300 || status === 304) {

        // Convert the JSON data file to an ordinary object
        let file = JSON.parse(xhr.responseText);

        // Get the filename
        file.name = source;

        // Assign the file as aproperty of the `assets` object so
        // you can access it later like this: `assets[file.json]`
        this[file.name] = file;

        // Texture atlas support:
        // If the JSON file has a `frames` property then
        // it is in a Texture Packer format
        if (file.frames) {

          // Create the tileset frames
          this.createTilesetFrames(file, source, loadHandler);
        } else {

          // Alert the load handler that the file has loaded
          loadHandler({
            type: 'load',
            path: [{ currentSrc: source }]
          });
        }
      } else {
        loadHandler({
          type: 'error',
          path: [{ currentSrc: source }]
        });
      }
    }

    // Send the requestt to load the file
    xhr.send();
  },

  /**
   * 
   * @param {Object} file 
   * @param {string} source 
   * @param {Function} loadHandler 
   */
  createTilesetFrames(file, source, loadHandler) {

    // Get the tileset image's file path
    let baseUrl = source.replace(/[^\/]*$/, '');

    // Use the `baseUrl` and `image` name property from the JSON
    // file's `meta` object to construct the full image source path
    let imageSource = baseUrl + file.meta.image;

    // The image's load handler
    let imageLoadHandler = (e) => {
      // Assign the image as a propertty of the `assets` object so
      // you can access it like this:
      // `assets['images/imageName.png']`
      this[imageSource] = image;

      // Loop through all the frames
      for (let frame of Object.keys(file.frames)) {

        // The `frame` object contains all the size and position
        // data for each sub-image.
        // Add the frame data to the asset object so that you
        // can access it later like this : `assets['frameName.png']`
        this[frame] = file.frames[frame];

        // Get a reference to the source so that it will be easy for
        // us to access it later
        this[frame].source = image;
      }

      // Alert the load handler that the file has loaded
      loadHandler(e);
    }

    // Load the tileset image
    let image = new Image();
    image.addEventListener('load', imageLoadHandler, false);
    image.src = imageSource;
  }
}