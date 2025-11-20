import os

directory = "output_folder"

# Iterate over the files in the directory
for i, filename in enumerate(os.listdir(directory)):
    # Split the file extension from the filename
    name, ext = os.path.splitext(filename)
    # Create the new filename with the sequential digits
    new_name = f"{i+1:04d}{ext}"
    # Rename the file
    os.rename(os.path.join(directory, filename), os.path.join(directory, new_name))
