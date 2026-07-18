import cv2
import os

# BATCH RENAME FIRST

# Input and output folders
input_folder = "2022dataset"
output_folder = "2022dataset_resize"

# Target size for resizing
target_size = (1024, 1024)

# Iterate through all files in input folder
for filename in os.listdir(input_folder):
    # Check if file is an image
    if filename.endswith(".jpg") or filename.endswith(".jpeg") or filename.endswith(".png"):
        # Read image
        img = cv2.imread(os.path.join(input_folder, filename))
        # Resize image
        resized_img = cv2.resize(img, target_size)
        # Save resized image to output folder
        cv2.imwrite(os.path.join(output_folder, filename), resized_img)
