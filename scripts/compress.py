from PIL import Image, ExifTags
import os

def correct_orientation(image):
    try:
        exif = image._getexif()
        if exif:
            orientation = exif.get(274)  # 274 is the EXIF tag for orientation
            if orientation == 3:
                image = image.rotate(180, expand=True)
            elif orientation == 6:
                image = image.rotate(-90, expand=True)
            elif orientation == 8:
                image = image.rotate(90, expand=True)
    except (AttributeError, KeyError, IndexError):
        # If there's an issue with EXIF data, just ignore and return the image as is
        pass
    return image

def compress_images(input_folder, output_folder, quality=85):
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    for filename in os.listdir(input_folder):
        if filename.lower().endswith((".jpg", ".jpeg", ".png")):
            img_path = os.path.join(input_folder, filename)
            try:
                img = Image.open(img_path)
                
                # Correct the orientation based on EXIF data
                img = correct_orientation(img)

                # Convert to RGB if necessary
                if img.mode != "RGB":
                    img = img.convert("RGB")

                output_path = os.path.join(output_folder, filename)

                # Save the image with compression
                img.save(output_path, "JPEG", optimize=True, quality=quality)
                print(f"Compressed and saved {filename} to {output_folder}")

            except Exception as e:
                # Print error and continue with the next file
                print(f"Error processing {filename}: {e}")

# Example usage
input_folder = "art_misc"
output_folder = "compressed"
compress_images(input_folder, output_folder, quality=15)
