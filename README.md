# kksihtkk's EXIF Frame

A browser-based tool for creating clean camera-style frames from your photos. Upload one image or a full batch, read basic EXIF metadata automatically, tune the frame design, and export finished PNG files.

## Features

- Batch photo upload
- Lightroom-style filmstrip for switching between photos
- Per-photo frame settings
- Apply the current frame settings to the whole batch
- Automatic EXIF metadata parsing for camera, lens, focal length, aperture, shutter speed, and ISO
- Adjustable aspect ratio, export size, padding, bottom caption area, corner radius, and brand color
- Custom watermarks with text, icon, size, opacity, and position controls
- Single-image PNG export
- Batch ZIP export
- Fully client-side processing

## Tech Stack

- React
- Vite
- Canvas API
- JSZip

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

## Usage

1. Open the app in your browser.
2. Click **Add photos** and select one or more images.
3. Choose a photo from the filmstrip.
4. Adjust frame settings and watermarks for the selected photo.
5. Use **Apply to all** if you want the same frame style across the whole batch.
6. Export the selected image as PNG or export the entire batch as a ZIP archive.

## Notes

EXIF support depends on the metadata available in the uploaded file. JPEG files usually work best. PNG, WebP, and other browser-supported image formats can still be framed, but may not contain camera metadata.

All image processing happens locally in the browser. Uploaded photos are not sent to a server.

## Author

Created by [kksihtkk](https://portfolio.kksihtkk.dev).

## License

This project is licensed under the [MIT License](https://opensource.org/license/mit).
