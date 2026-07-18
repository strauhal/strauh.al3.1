from PIL import Image
import os

# Set the paths to the input folders containing images
folder_a = "2022dataset_canny"
folder_b = "2022dataset_resize"

# Set the path to the output folder for combined images
output_folder = "2022combined_images"

# Loop through each file in both input folders
for i, (file_a, file_b) in enumerate(zip(sorted(os.listdir(folder_a)), sorted(os.listdir(folder_b)))):
    # Check if both files are images and not .DS_Store files
    if (file_a.endswith(".jpg") or file_a.endswith(".jpeg") or file_a.endswith(".png")) and \
       (file_b.endswith(".jpg") or file_b.endswith(".jpeg") or file_b.endswith(".png")) and \
       (not file_a.startswith(".")) and (not file_b.startswith(".")):
        
        # Open the first image
        with Image.open(os.path.join(folder_a, file_a)) as image_a:
            # Open the second image
            with Image.open(os.path.join(folder_b, file_b)) as image_b:
                # Resize the images to be 2048 pixels wide
                size_a = (2048, int(2048 * image_a.size[1] / image_a.size[0]))
                size_b = (2048, int(2048 * image_b.size[1] / image_b.size[0]))
                image_a = image_a.resize(size_a)
                image_b = image_b.resize(size_b)

                # Create a new image with a height of 2048 pixels and a width of 4096 pixels
                combined_image = Image.new("RGB", (4096, 2048))

                # Paste the first image on the left side of the new image
                combined_image.paste(image_a, (0, 0))

                # Paste the second image on the right side of the new image
                combined_image.paste(image_b, (2048, 0))

                # Save the combined image to the output folder with the same filename as the first image
                combined_image.save(os.path.join(output_folder, file_a))
