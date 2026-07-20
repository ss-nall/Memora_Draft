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

def extract_face_embeddings(image_path: str):
    """
    Extracts 512-dimensional face embeddings for ALL faces found using InsightFace.
    Returns an empty list if no faces are found.
    """
    try:
        # Read the image using OpenCV
        img = cv2.imread(image_path)
        if img is None:
            return []
            
        # 1. Preprocess Image
        img = preprocess_image(img)
        
        # 2. Multi-Scale & Tiled Detection
        # (This internally handles NMS duplicate removal and alignment)
        faces = multi_scale_tiled_detection(img, app)
        
        # 3. Sort faces by Bounding Box Area (Largest First)
        # This fixes the bug where a background face was incorrectly chosen as the guest's primary embedding
        if faces:
            def get_area(face):
                bbox = face.bbox
                return (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
            faces = sorted(faces, key=get_area, reverse=True)
        
        normalized_embeddings = []
        for face in faces:
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
    from models.face import Face
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
