from PIL import Image
import os

# Set the input and output directories
input_dir = "images_to_change/"
output_dir = "ready4testing"

# Loop through each file in the input directory
for filename in os.listdir(input_dir):
    if filename.endswith(".jpg"):
        # Open the PNG file using Pillow
        img = Image.open(os.path.join(input_dir, filename))
        img = img.convert("RGB")

        
        # Resize the image to 512x512
        img = img.resize((1024, 1024))
        
        # Set the output filename to be the same as the input filename, but with a .jpg extension
        output_filename = os.path.splitext(filename)[0] + ".jpg"
        
        # Save the image to the output directory as a JPEG file
        img.save(os.path.join(output_dir, output_filename), "JPEG")
