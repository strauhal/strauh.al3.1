import os
from PIL import Image

import PIL.Image
PIL.Image.MAX_IMAGE_PIXELS = None


# Define the input and output directories
input_dir = "photography"
output_dir = "resized_images"

# Create the output directory if it doesn't exist
if not os.path.exists(output_dir):
    os.mkdir(output_dir)

# Loop through each file in the input directory
for file_name in os.listdir(input_dir):
    # Check if the file is a JPEG, JPG, or PNG
    if file_name.endswith(".jpeg") or file_name.endswith(".jpg") or file_name.endswith(".png"):
        # Open the image
        image = Image.open(os.path.join(input_dir, file_name))

        # Resize the image
        resized_image = image.resize((1024, 1024))

        # Save the resized image in the output directory
        resized_image.save(os.path.join(output_dir, file_name))
