import cv2
import os
from typing import List, Tuple
import logging

logger = logging.getLogger(__name__)

# ==============================================================================
# AI MODULE EXPLANATION: VIDEO FRAME EXTRACTION
# Purpose: Extract static images from a video so the image-based AI can process it.
# Model used: OpenCV VideoCapture
# Why it was selected: OpenCV provides fast C++ level video decoding natively in python.
# Input: Video file path.
# Output: List of tuples -> [(timestamp_in_seconds, frame_image_matrix), ...]
# Interval chosen: 1 Frame Per Second (1 fps).
# Why this interval: Processing 60 frames for a 1-second clip means running heavy 
# AI models 60 times on essentially the exact same face. Processing at 1 fps 
# reduces computation by 98% while perfectly capturing any guest in the scene.
# Limitations: If a person runs across the camera in 0.5 seconds, they might be missed.
# ==============================================================================
def extract_frames(video_path: str, fps_interval: int = 1) -> List[Tuple[float, any]]:
    """
    Extracts frames from a video at a specified interval.
    fps_interval=1 means we grab exactly 1 frame for every second of video.
    """
    frames = []
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        logger.error(f"Failed to open video file: {video_path}")
        return frames

    # Get video properties
    video_fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    if video_fps <= 0:
        video_fps = 30.0 # fallback

    # Calculate frame stride to get 1 frame per 'fps_interval' seconds
    frame_stride = int(video_fps * fps_interval)
    
    current_frame = 0
    while True:
        # Jump directly to the desired frame index to avoid decoding every frame
        cap.set(cv2.CAP_PROP_POS_FRAMES, current_frame)
        ret, frame = cap.read()
        
        if not ret:
            break
            
        timestamp_sec = current_frame / video_fps
        frames.append((timestamp_sec, frame))
        
        current_frame += frame_stride
        if current_frame >= total_frames:
            break
            
    cap.release()
    logger.info(f"Extracted {len(frames)} frames from video {video_path}")
    return frames
