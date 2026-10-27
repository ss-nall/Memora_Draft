import cv2
import faiss
import numpy as np
from insightface.app import FaceAnalysis
from core.ai_pipeline import preprocess_image, multi_scale_tiled_detection

# Initialize InsightFace model
# We use the 'buffalo_l' model for state-of-the-art accuracy as per strict architecture spec
app = FaceAnalysis(name='buffalo_l')
# Standard detection resolution for tiles, lowered det_thresh for side profiles
app.prepare(ctx_id=0, det_size=(640, 640), det_thresh=0.3)

# We no longer use in-memory global indices due to cross-process memory issues.
# FAISS indices are now built on the fly from the PostgreSQL 'faces' table.

def load_image_robustly(image_path: str) -> np.ndarray:
    """
    Loads an image from image_path, correcting EXIF rotation metadata (crucial for phone selfies),
    handling unicode paths on Windows, and converting to standard 3-channel BGR numpy array.
    """
    try:
        from PIL import Image, ImageOps
        with Image.open(image_path) as pil_img:
            # Correct orientation from EXIF (if photo was taken vertically on a phone)
            pil_img = ImageOps.exif_transpose(pil_img)
            # Ensure RGB
            if pil_img.mode != "RGB":
                pil_img = pil_img.convert("RGB")
            # Convert to numpy array (RGB -> BGR for OpenCV/InsightFace)
            rgb_arr = np.array(pil_img)
            bgr_arr = cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2BGR)
            return bgr_arr
    except Exception as e:
        # Fallback to OpenCV
        try:
            with open(image_path, "rb") as f:
                bytes_data = bytearray(f.read())
            arr = np.asarray(bytes_data, dtype=np.uint8)
            img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            return img
        except Exception:
            return cv2.imread(image_path)

def extract_face_embeddings(image_path: str):
    """
    Extracts 512-dimensional face embeddings for ALL faces found using InsightFace.
    Applies multi-strategy detection (direct raw image, EXIF rotation correction, 
    multi-angle fallback, and multi-scale tiling) to ensure selfies and group photos 
    are reliably detected.
    """
    try:
        img = load_image_robustly(image_path)
        if img is None or img.size == 0:
            return []

        faces = []

        # Strategy 1: Direct InsightFace detection on raw (EXIF-corrected) image
        # This is the most reliable and accurate approach for selfies and standard portraits
        faces = app.get(img)

        # Strategy 2: If no face found, try 90-degree rotations in case EXIF tag was missing/stripped
        if not faces:
            for rot in [cv2.ROTATE_90_CLOCKWISE, cv2.ROTATE_180, cv2.ROTATE_90_COUNTERCLOCKWISE]:
                rotated = cv2.rotate(img, rot)
                rot_faces = app.get(rotated)
                if rot_faces:
                    faces = rot_faces
                    break

        # Strategy 3: If still no face found, try CLAHE contrast enhancement
        if not faces:
            try:
                enhanced = preprocess_image(img)
                faces = app.get(enhanced)
            except Exception:
                pass

        # Strategy 4: If still no face found (e.g. huge crowd / tiny faces), use multi-scale tiling
        if not faces:
            try:
                faces = multi_scale_tiled_detection(img, app)
            except Exception:
                pass

        if not faces:
            return []

        # Sort faces by Bounding Box Area (Largest First so primary subject is index 0)
        def get_area(face):
            bbox = face.bbox
            return (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
        faces = sorted(faces, key=get_area, reverse=True)

        normalized_embeddings = []
        for face in faces:
            if hasattr(face, 'embedding') and face.embedding is not None:
                norm = np.linalg.norm(face.embedding)
                if norm > 0:
                    normalized_embeddings.append(face.embedding / norm)

        return normalized_embeddings
    except Exception as e:
        print(f"Face detection failed for {image_path}: {e}")
        return []

def add_embedding_to_index(db, event_id: str, media_id: str, embedding: list, timestamp: float = None):
    """Add a face embedding to the persistent PostgreSQL faces table."""
    from models.face import Face
    
    # Save the vector directly into the DB.
    # The JSON column natively supports Python lists.
    new_face = Face(
        event_id=event_id,
        media_id=media_id,
        embedding=embedding,
        timestamp=timestamp
    )
    db.add(new_face)
    db.commit()

def find_matching_photos(db, event_id: str, target_embedding: list, threshold: float = 0.35):
    """
    Searches the FAISS index for vectors close to the target_embedding.
    Builds the FAISS index on the fly from the persistent DB.
    Returns a list of media_ids.
    """
    import uuid
    from models.face import Face
    if isinstance(event_id, str):
        try:
            event_id = uuid.UUID(event_id)
        except Exception:
            pass
    faces = db.query(Face).filter(Face.event_id == event_id).all()
    
    if not faces:
        return []
        
    # Build on-the-fly FAISS index
    index = faiss.IndexFlatIP(512)
    mapping = {}
    
    # Convert all DB embeddings to a matrix
    embedding_matrix = []
    for i, face in enumerate(faces):
        embedding_matrix.append(face.embedding)
        mapping[i] = {"media_id": str(face.media_id), "timestamp": face.timestamp}
        
    if not embedding_matrix:
        return []
        
    embedding_np = np.array(embedding_matrix).astype('float32')
    index.add(embedding_np)
    
    # Search
    target_np = np.array([target_embedding]).astype('float32')
    distances, indices = index.search(target_np, k=min(100, index.ntotal))
    
    import logging
    logger = logging.getLogger("uvicorn.error")
    matched_results = []
    
    logger.info("FAISS Search Results (Cosine Similarity, ID):")
    for sim, idx in zip(distances[0], indices[0]):
        logger.info(f"- Similarity: {sim:.4f}, FAISS ID: {idx}")
        # buffalo_l Cosine Similarity threshold is usually higher, but we will use 0.35 as a safe bet
        if sim > threshold and idx != -1:
            matched_results.append(mapping[idx])
            
    return matched_results
