"""
One-time script to upload the ValaFlow logo SVG to Cloudinary
and print the public URL to use in emails.
"""
import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

# ValaFlow logo as SVG string (transparent background)
svg_content = """<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M 20 25 V 75 H 14 A 4 4 0 0 1 10 71 V 29 A 4 4 0 0 1 14 25 Z" fill="white"/>
  <path d="M 24 25 H 60 L 24 70 Z" fill="white"/>
  <path d="M 64 25 H 90 V 75 H 74 V 35 L 42 75 H 24 Z" fill="#2563eb"/>
</svg>"""

# Upload SVG as raw file, then request PNG version via Cloudinary's f_png transformation
result = cloudinary.uploader.upload(
    "data:image/svg+xml;base64," + __import__('base64').b64encode(svg_content.encode()).decode(),
    public_id="valaflow/logo",
    overwrite=True,
    resource_type="image",
    format="png",
    transformation=[{"width": 120, "height": 120, "crop": "fit"}]
)

print("\n" + "="*60)
print("[OK] Logo uploaded successfully!")
print("[URL] " + result['secure_url'])
print("="*60 + "\n")
