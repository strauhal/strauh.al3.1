from PIL import Image

# Open the first image
img1 = Image.open("image1.jpg")

# Open the second image
img2 = Image.open("image2.jpg")

# Resize both images to half their original size
size = (img1.width//2, img1.height//2)
img1 = img1.resize(size)
img2 = img2.resize(size)

# Create a new image with twice the width of the original images
new_size = (size[0]*2, size[1])
new_img = Image.new("RGB", new_size)

# Paste the first image on the left side of the new image
new_img.paste(img1, (0, 0))

# Paste the second image on the right side of the new image
new_img.paste(img2, (size[0], 0))

# Save the new image
new_img.save("combined.jpg")
