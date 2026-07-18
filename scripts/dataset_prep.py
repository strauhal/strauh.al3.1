import cv2
import os

input_folder = "2022dataset_resize"
output_folder = "2022dataset_canny"

# Make output folder if it doesn't exist
if not os.path.exists(output_folder):
    os.makedirs(output_folder)

# Set resize parameters
size = (1024, 1024)

# Loop through images in input folder
for filename in os.listdir(input_folder):
    # Open image using OpenCV
    img = cv2.imread(os.path.join(input_folder, filename))

    # Check if image is empty
    if img is None:
        print(f"Failed to read image {filename}")
        continue

    # Resize image
    img = cv2.resize(img, size)

    # Perform Canny edge detection
    edges = cv2.Canny(img, 100, 200)

    # Invert the image
    inverted = cv2.bitwise_not(edges)

    # Save the output image
    cv2.imwrite(os.path.join(output_folder, filename), inverted)
