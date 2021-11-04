class Loader {
  GALLERY_ROW_HEIGHT = 200;
  INFINITE_SCROLL_IMAGES_TO_LOAD = 20;

  media = [];

  currGalleryIndex = 0;

  init() {
    const initialContentToLoad = [];

    // Calculate how many images to show on page load
    const { innerWidth, innerHeight } = window;
    // Add on another row just in case
    const rows = innerHeight / this.GALLERY_ROW_HEIGHT + 1;

    let currWidth = 0;
    const totalWidth = innerWidth * rows;

    for (let i = 0; i < this.media.length; i++) {
      const { width, height } = this.media[i];
      const thumbnailWidth = (width / height) * this.GALLERY_ROW_HEIGHT;

      if (currWidth >= totalWidth || currWidth + thumbnailWidth >= totalWidth) {
        break;
      }

      currWidth += thumbnailWidth;
      initialContentToLoad.push(this.media[i]);
      this.currGalleryIndex++;
    }

    // Load initial content
    initialContentToLoad.forEach((item, i) => {
      this.addMediaToGallery(item, i);
    });

    $('#media').justifiedGallery({
      rowHeight: this.GALLERY_ROW_HEIGHT,
    });

    this.handleInfiniteScroll();
  }

  addMedia(item) {
    this.media.push(item);
  }

  addMediaToGallery(item, index) {
    const image = document.createElement('img');
    image.setAttribute('id', `item${index}`);
    image.addEventListener('click', () => {
      this.openSlides(index);
    });
    image.setAttribute('src', `${item.small}`);

    const anchor = document.createElement('a');
    anchor.setAttribute('href', `${item.isVideo ? item.download : item.large}`);
    anchor.setAttribute('onclick', 'return false;');
    anchor.append(image);

    document.querySelector('#media').append(anchor);
  }

  openSlides(at) {
    const pswpElement = document.querySelectorAll('.pswp')[0];

    const items = this.media.map((item, i) => {
      if (item.isVideo) {
        return {
          html: `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%;">
              <video id="video-slide-${i}" class="video-js" controls preload="auto" poster="${item.large}" style="height: 100%; width: 100%;">
                <source src="${item.download}" type="video/mp4"></source>
              </video>
            </div>
          `,
          videoSrc: item.download,
        }
      }
      return {
        src: item.large,
        w: item.width,
        h: item.height,
      }
    });


    // Initializes and opens PhotoSwipe
    const slides = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, {
      allowPanToNext: false,
      closeOnVerticalDrag: false,
      history: false,
      index: at ?? 0, // start at first slide
      shareButtons: [],
      tapToClose: true,
    });

    slides.init();

    window.slides = slides;

    slides.listen('beforeChange', () => {
      console.log(slides.currItem);
      if (slides.getCurrentIndex() + this.INFINITE_SCROLL_IMAGES_TO_LOAD >= this.currGalleryIndex) {
        this.loadMoreImagesToGallery();
      }

      // Stop current video if any
      // The slide is already the next one...
      const indexToFind = slides.getCurrentIndex() - 1;
      document.querySelector(`#video-slide-${indexToFind}`)?.pause();
    });

    slides.listen('close', () => {
      // Stop current video if any
      const indexToFind = slides.getCurrentIndex();
      document.querySelector(`#video-slide-${indexToFind}`)?.pause();

      // https://stackoverflow.com/questions/487073/how-to-check-if-element-is-visible-after-scrolling
      function isScrolledIntoView(el) {
        const rect = el.getBoundingClientRect();
        const elemTop = rect.top;
        const elemBottom = rect.bottom;

        const isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);
        return isVisible;
      }

      const galleryPhoto = document.querySelector(`#item${slides.getCurrentIndex()}`);
      if (!isScrolledIntoView(galleryPhoto)) {
        document.querySelector(`#item${slides.getCurrentIndex()}`).scrollIntoView();
        window.scrollBy(0, -window.innerHeight / 5);
      }
    });
  }

  handleInfiniteScroll() {
    window.onscroll = () => {
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
        this.loadMoreImagesToGallery();
      }
    };
  }

  loadMoreImagesToGallery() {
    for (let i = this.currGalleryIndex, j = 0; i < this.media.length && j < this.INFINITE_SCROLL_IMAGES_TO_LOAD; i++, j++) {
      this.addMediaToGallery(this.media[i], i);
      this.currGalleryIndex++;
    }

    $('#media').justifiedGallery('norewind');
  }
}