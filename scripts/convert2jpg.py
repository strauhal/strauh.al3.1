from PIL import Image
import os

# Path to the folder containing the images
path = "resized_images"

# Loop through all files in the folder
for filename in os.listdir(path):
    # Open the image file
    with Image.open(os.path.join(path, filename)) as img:
        # Convert the image to RGB format
        img = img.convert("RGB")
        # Save the image as JPEG with the same filename
        img.save(os.path.join(path, os.path.splitext(filename)[0] + ".jpg"))
