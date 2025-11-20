from PIL import Image
import os

# set input directories
folder1 = "/path/to/folder1/"
folder2 = "/path/to/folder2/"

# set output directory
output_folder = "/path/to/output/folder/"

# get list of files in each folder
folder1_files = os.listdir(folder1)
folder2_files = os.listdir(folder2)

# loop through the files in the folders
for i in range(len(folder1_files)):
    # open the images from each folder
    img1 = Image.open(folder1 + folder1_files[i])
    img2 = Image.open(folder2 + folder2_files[i])

    # get the size of each image
    width1, height1 = img1.size
    width2, height2 = img2.size

    # make sure both images are the same size
    if width1 != height1 or width2 != height2:
        print("Error: images must be square")
        break

    # create a new image with twice the width
    new_width = width1 * 2
    new_height = height1
    new_img = Image.new('RGB', (new_width, new_height), (255, 255, 255))

    # paste the images into the new image
    new_img.paste(img1, (0, 0))
    new_img.paste(img2, (width1, 0))

    # save the new image
    new_img.save(output_folder + "combined_" + folder1_files[i])
