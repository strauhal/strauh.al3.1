from PIL import Image
import os

# Set the dimensions of each image and the grid layout
image_width = 400  # Adjust as needed
image_height = 400  # Adjust as needed
images_per_row = 20
images_per_column = 20

# Set the folder path containing the images
folder_path = "akira"  # Replace with the actual folder path

# Get the list of image files in the folder and sort them alphabetically
image_files = sorted([file for file in os.listdir(folder_path) if file.endswith((".tif", ".png"))])

# Calculate the total number of grid images needed
num_images_per_grid = images_per_row * images_per_column
num_grid_images = len(image_files) // num_images_per_grid
if len(image_files) % num_images_per_grid != 0:
    num_grid_images += 1

# Create the grid images
for grid_index in range(num_grid_images):
    # Create a new blank grid image
    grid_width = image_width * images_per_row
    grid_height = image_height * images_per_column
    grid_image = Image.new("RGB", (grid_width, grid_height))

    # Calculate the range of images to process for this grid image
    start_index = grid_index * num_images_per_grid
    end_index = min(start_index + num_images_per_grid, len(image_files))
    image_files_subset = image_files[start_index:end_index]

    # Iterate over the sorted image files subset and paste them onto the grid image
    for i, image_file in enumerate(image_files_subset):
        image_path = os.path.join(folder_path, image_file)
        image = Image.open(image_path)
        x = (i % images_per_row) * image_width
        y = (i // images_per_row) * image_height
        grid_image.paste(image.resize((image_width, image_height)), (x, y))

    # Save the grid image
    output_file_name = f"grid_image_{grid_index + 1}.jpg"  # Output file name for each grid image
    output_file_path = os.path.join(folder_path, output_file_name)
    grid_image.save(output_file_path)

    print(f"Grid image {grid_index + 1} created successfully!")

print("All grid images created successfully!")
