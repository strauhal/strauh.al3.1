import cv2
import os

# Set the path to the input folder containing images
input_folder = "2022combined_images"

# Set the path to the output folder for the saturated images
output_folder = "2022combined_images_sat"

# Set the saturation value
saturation_value = 100

# Loop through each file in the input folder
for filename in os.listdir(input_folder):
    # Check if the file is an image
    if filename.endswith(".jpg") or filename.endswith(".jpeg") or filename.endswith(".png"):
        # Load the image
        img = cv2.imread(os.path.join(input_folder, filename))
        # Convert the image from BGR to HSV
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        # Increase the saturation value
        hsv[..., 1] += saturation_value
        # Convert the image back from HSV to BGR
        img_saturated = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
        # Save the saturated image to the output folder
        cv2.imwrite(os.path.join(output_folder, filename), img_saturated)
