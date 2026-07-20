import cv2
import numpy as np
from typing import List, Tuple, Dict, Any
from insightface.app import FaceAnalysis

# ==============================================================================
# AI MODULE EXPLANATION: IMAGE PREPROCESSING
# Purpose: Prepare raw images for optimal AI face detection by correcting lighting/noise.
# Model used: OpenCV (cv2) heuristics.
# Why it was selected: OpenCV is fast, lightweight, and doesn't require a neural network for basic contrast/brightness fixes.
# Input: Raw BGR image matrix (numpy array).
# Output: Enhanced BGR image matrix.
# Alternatives: Deep learning enhancement (e.g., GFPGAN), but too slow for preprocessing.
# Advantages: Extremely fast, improves detection in dark/washed out photos.
# Limitations: Cannot fix heavily blurred or destroyed images.
# ==============================================================================
def preprocess_image(img: np.ndarray) -> np.ndarray:
    """Enhance image contrast and brightness."""
    # Convert to LAB color space
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l_channel, a, b = cv2.split(lab)
    
    # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) to L-channel
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    cl = clahe.apply(l_channel)
    
    # Merge and convert back
    limg = cv2.merge((cl, a, b))
    enhanced_img = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
    return enhanced_img

# ==============================================================================
# AI MODULE EXPLANATION: NON-MAXIMUM SUPPRESSION (NMS)
# Purpose: Remove duplicate face detections from overlapping tiles/scales.
# Model used: Mathematical Intersection over Union (IoU).
# Why it was selected: Industry standard algorithm for bounding box deduplication.
# Input: List of detected faces (with bboxes and scores) from all tiles/scales.
# Output: Filtered list of unique faces.
# Alternatives: Soft-NMS, but standard NMS is sufficient and faster for faces.
# Advantages: Prevents the same person from being counted twice.
# Limitations: May suppress distinct faces if they heavily overlap (e.g., people hugging tightly).
# ==============================================================================
def compute_iou(boxA: List[float], boxB: List[float]) -> float:
    """Compute Intersection over Union (IoU) of two bounding boxes."""
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    interArea = max(0, xB - xA) * max(0, yB - yA)
    boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
    boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])

    iou = interArea / float(boxAArea + boxBArea - interArea + 1e-5)
    return iou

def apply_nms(faces: List[Any], iou_threshold: float = 0.4) -> List[Any]:
    """Apply Non-Maximum Suppression to filter out duplicate face detections."""
    if not faces:
        return []

    # Sort faces by detection score descending
    faces = sorted(faces, key=lambda f: f.det_score, reverse=True)
    
    keep = []
    for face in faces:
        is_duplicate = False
        for kept_face in keep:
            iou = compute_iou(face.bbox, kept_face.bbox)
            if iou > iou_threshold:
                is_duplicate = True
                break
        if not is_duplicate:
            keep.append(face)
            
    return keep

# ==============================================================================
# AI MODULE EXPLANATION: TILING & MULTI-SCALE DETECTION
# Purpose: Detect every single face, no matter how small, in crowded group photos.
# Model used: SCRFD (InsightFace) applied on overlapping image slices.
# Why it was selected: Resolves the issue where 4K images are shrunk to 640x640, destroying small faces.
# Input: Enhanced image matrix, InsightFace app instance.
# Output: List of all detected faces across all scales/tiles.
# Alternatives: Using a massive GPU to process 4K images natively, but consumes too much VRAM.
# Advantages: Guarantees high recall for tiny faces.
# Limitations: Computationally expensive (runs the detector multiple times).
# ==============================================================================
def multi_scale_tiled_detection(img: np.ndarray, app: FaceAnalysis) -> List[Any]:
    """
    Run detection on multiple scales and overlapping tiles.
    Scales: 1.0x, 1.5x, 2.0x
    Tile Size: 1024x1024
    Overlap: 20%
    """
    all_faces = []
    scales = [1.0, 1.5, 2.0]
    
    TILE_SIZE = 1024
    OVERLAP_RATIO = 0.2
    STRIDE = int(TILE_SIZE * (1 - OVERLAP_RATIO))
    
    for scale in scales:
        if scale != 1.0:
            width = int(img.shape[1] * scale)
            height = int(img.shape[0] * scale)
            scaled_img = cv2.resize(img, (width, height), interpolation=cv2.INTER_LINEAR)
        else:
            scaled_img = img

        h, w = scaled_img.shape[:2]
        
        # If image is smaller than tile, just process the whole scaled image
        if h <= TILE_SIZE and w <= TILE_SIZE:
            faces = app.get(scaled_img)
            # Adjust bounding boxes back to scale 1.0
            for face in faces:
                face.bbox = face.bbox / scale
                # InsightFace keypoints could also be adjusted, but since we already have the embedding, 
                # we just need bbox for NMS. The embedding is already computed on the high-res crop!
            all_faces.extend(faces)
            continue
            
        # Tiling logic
        for y in range(0, h, STRIDE):
            for x in range(0, w, STRIDE):
                y1 = y
                y2 = min(y + TILE_SIZE, h)
                x1 = x
                x2 = min(x + TILE_SIZE, w)
                
                # If the remaining slice is too small, adjust to grab a full tile from the edge
                if y2 - y1 < TILE_SIZE and h >= TILE_SIZE:
                    y1 = h - TILE_SIZE
                    y2 = h
                if x2 - x1 < TILE_SIZE and w >= TILE_SIZE:
                    x1 = w - TILE_SIZE
                    x2 = w
                
                tile = scaled_img[y1:y2, x1:x2]
                faces = app.get(tile)
                
                for face in faces:
                    # Boundary check to prevent corrupted embeddings from cut-off faces
                    # face.bbox is [x1, y1, x2, y2] relative to the tile
                    MARGIN = 10
                    tx1, ty1, tx2, ty2 = face.bbox
                    
                    # Check if face touches the LEFT tile boundary (and it's not the left image edge)
                    if tx1 < MARGIN and x1 > 0: continue
                    # Check if face touches the TOP tile boundary (and it's not the top image edge)
                    if ty1 < MARGIN and y1 > 0: continue
                    # Check if face touches the RIGHT tile boundary
                    if tx2 > (x2 - x1) - MARGIN and x2 < w: continue
                    # Check if face touches the BOTTOM tile boundary
                    if ty2 > (y2 - y1) - MARGIN and y2 < h: continue
                    
                    # Translate bbox to scaled image coordinates
                    face.bbox[0] += x1
                    face.bbox[1] += y1
                    face.bbox[2] += x1
                    face.bbox[3] += y1
                    
                    # Scale down to original image 1.0 coordinates
                    face.bbox = face.bbox / scale
                    all_faces.append(face)

    # Remove duplicates across all tiles and scales
    unique_faces = apply_nms(all_faces, iou_threshold=0.4)
    return unique_faces

