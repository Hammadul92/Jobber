import base64
from django.core.files.base import ContentFile


def image_from_base64(base64_data, filename_prefix="uploaded_image"):
    """
    Converts a base64-encoded image string into a Django ContentFile.

    Args:
        base64_data (str): base64 string like "data:image/png;base64,...."
        filename_prefix (str): prefix for the generated file name.

    Returns:
        ContentFile: ready to assign to an ImageField.
    Raises:
        ValueError: if the base64 string is invalid or cannot be decoded.
    """
    if not base64_data:
        raise ValueError("No base64 data provided")

    if not base64_data.startswith("data:image"):
        raise ValueError("Invalid signature format")

    try:
        format, imgstr = base64_data.split(";base64,")
        ext = format.split("/")[-1]
        file_name = f"{filename_prefix}.{ext}"
        return ContentFile(base64.b64decode(imgstr), name=file_name)
    except Exception as e:
        raise ValueError(f"Error decoding base64 image: {e}")
