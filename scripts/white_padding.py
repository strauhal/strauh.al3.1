import os
from PIL import Image

input_folder = "ready4testing"
output_folder = "padded"
padding_size = 1024
color = (255, 255, 255)

if not os.path.exists(output_folder):
    os.makedirs(output_folder)

for filename in os.listdir(input_folder):
    if filename.endswith(".jpg") or filename.endswith(".jpeg") or filename.endswith(".png"):
        # Load the image
        image = Image.open(os.path.join(input_folder, filename))

        # Add padding to the right of the image
        new_image = Image.new("RGB", (image.width + padding_size, image.height), color)

        # if you want to change if the padding is on the left or right, replace the 0 with image.width

        new_image.paste(image, (0, 0))

        # Save the modified image
        new_filename = f"padded_{filename}"
        new_image.save(os.path.join(output_folder, new_filename))
