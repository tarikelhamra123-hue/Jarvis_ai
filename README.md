# JARVIS AI – Airbnb Commercial Video Tool

This repository contains a lightweight, browser-based video-ad tool for creating a 20-second vertical Airbnb luxury advertisement using real property images and simple cinematic motion.

What it does
- Upload 5–10 approved property photos.
- Preview a luxury 9:16 video composition.
- Create a real browser-rendered video using the canvas + MediaRecorder API.
- Download the result as a `.webm` video file.
- Provide a local FFmpeg conversion command to turn the output into `.mp4` if needed.

Important
- This tool does not invent property details, prices, or amenities.
- It only uses the photos you upload.
- The final output is image-based motion graphics and a cinematic slideshow, not AI-generated footage.

How to use it
1. Open the project in a browser through a local static web server.
2. Upload 5–10 real property images.
3. Adjust the headline, accent line, and CTA.
4. Click “Render cinematic ad”.
5. The browser records a 20-second 9:16 ad and downloads a video file.

Run locally with Python

```bash
cd /path/to/Jarvis_ai
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

Optional FFmpeg conversion to MP4

If your machine has FFmpeg installed:

```bash
ffmpeg -i airbnb-luxury-ad.webm -c:v libx264 -pix_fmt yuv420p -movflags +faststart airbnb-luxury-ad.mp4
```

Files in this repo
- `index.html` — application shell
- `styles.css` — responsive premium UI styling
- `app.js` — upload workflow, preview animation, and browser video recording
- `README.md` — usage instructions

Production notes
- Output is designed for vertical 1080×1920 advertisement use.
- The motion is gentle, polished, and suitable for a commercial sample.
- All text and styling are kept simple and client-safe.

Next step for the client-ready sample
- Replace the sample headline and CTA with the property’s exact real wording if approved.
- Use only real property images and the correct Airbnb listing language.
- Present the result as a “cinematic image-based ad” rather than AI-generated footage.
