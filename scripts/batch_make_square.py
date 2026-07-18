from PIL import Image
import os

def make_square(image):
    width, height = image.size
    size = max(width, height)
    new_im = Image.new('RGB', (size, size), (255, 255, 255))
    new_im.paste(image, ((size - width) // 2, (size - height) // 2))
    return new_im

# Input folder path
folder_path = "thresholds"

# Output folder path
output_folder_path = "squared_images"

# Create output folder if it doesn't exist
if not os.path.exists(output_folder_path):
    os.mkdir(output_folder_path)

# Loop through images in input folder
for filename in os.listdir(folder_path):
    if filename.endswith('.jpg') or filename.endswith('.jpeg') or filename.endswith('.png'):
        # Open image
        image_path = os.path.join(folder_path, filename)
        image = Image.open(image_path)
        
        # Make square
        square_image = make_square(image)
        
        # Save output image
        output_filename = f"squared_{filename}"
        output_path = os.path.join(output_folder_path, output_filename)
        square_image.save(output_path)
