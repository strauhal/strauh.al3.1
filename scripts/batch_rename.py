import os

# set the path to the input folder containing the images
input_folder = "2021dataset_resize"

# set the prefix for the new filenames
prefix = "image"

# initialize a counter
counter = 0

# loop through each file in the input folder
for filename in os.listdir(input_folder):
    # check if the file is an image
    if filename.endswith(".jpg") or filename.endswith(".jpeg") or filename.endswith(".png"):
        # construct the new filename with the prefix and counter
        new_filename = f"{prefix}_{counter:04d}.jpg"
        # increment the counter
        counter += 1
        # rename the file with the new filename
        os.rename(os.path.join(input_folder, filename), os.path.join(input_folder, new_filename))
