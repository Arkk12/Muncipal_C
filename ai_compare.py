import cv2
import numpy as np
from skimage.metrics import structural_similarity as compare_ssim

def compare_before_after(before_path, after_path):
    try:
        # Read images in grayscale
        img1 = cv2.imread(before_path, cv2.IMREAD_GRAYSCALE)
        img2 = cv2.imread(after_path, cv2.IMREAD_GRAYSCALE)
        
        if img1 is None or img2 is None:
            return False, 0.0, "Error reading images"
            
        # Resize after image to match before image size
        img2 = cv2.resize(img2, (img1.shape[1], img1.shape[0]))
        
        # Compute Structural Similarity Index (SSIM)
        score, _ = compare_ssim(img1, img2, full=True)
        similarity_percent = round(score * 100, 2)
        
        # NEW LOGIC as per your requirement
        if similarity_percent < 20:
            is_fixed = True      # Work is successful
            remark = f"✅ Work Done - AI Verified (Similarity: {similarity_percent}%)"
        else:
            is_fixed = False     # Work not satisfactory
            remark = f"❌ Work Not Done - Pothole still visible (Similarity: {similarity_percent}%)"
        
        return is_fixed, similarity_percent, remark
        
    except Exception as e:
        print("AI Compare Error:", e)
        return False, 0.0, "AI Comparison Failed"