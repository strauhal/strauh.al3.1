from PIL import Image

Image.MAX_IMAGE_PIXELS = None

def slice_image(image_path, output_path):
    image = Image.open(image_path)
    image_width, image_height = image.size
    square_size = min(image_width, image_height) // 20  # assuming the image is square and has x tiles

    count = 5200 # count from a certain number (for more than 1 page)
    for y in range(20): # <- change these too 
        for x in range(20): # <- and this 
            left = x * square_size
            upper = y * square_size
            right = left + square_size
            lower = upper + square_size
            tile = image.crop((left, upper, right, lower))
            tile.save(output_path + "/tile_" + str(count) + ".tif")
            count += 1

    print("Image sliced into", count, "square tiles.")

    PIL.Image.MAX_IMAGE_PIXELS = 500000000

# Example usage:
image_path = "photointerp14.tif"
output_path = "photointerpslices"
slice_image(image_path, output_path)
