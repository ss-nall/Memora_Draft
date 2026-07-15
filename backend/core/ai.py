import cv2
import faiss
import numpy as np
from insightface.app import FaceAnalysis

# Initialize InsightFace model
# We use the 'buffalo_l' model for state-of-the-art accuracy
app = FaceAnalysis(name='buffalo_l')
app.prepare(ctx_id=0, det_size=(640, 640))

# Pre-load FAISS indices in a dictionary: {event_id: faiss.IndexFlatL2}
_indices = {}
_id_mappings = {} # {event_id: {faiss_id: media_id}}

def get_event_index(event_id: str):
    """Retrieve or create a FAISS index for a specific event."""
    if event_id not in _indices:
        # InsightFace buffalo_l produces 512-dimensional embeddings
        # IndexFlatIP computes inner product (Cosine Similarity for normalized vectors)
        _indices[event_id] = faiss.IndexFlatIP(512)
        _id_mappings[event_id] = {}
    return _indices[event_id], _id_mappings[event_id]

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
            
        faces = app.get(img)
        normalized_embeddings = []
        for face in faces:
            norm = np.linalg.norm(face.embedding)
            if norm > 0:
                normalized_embeddings.append(face.embedding / norm)
        return normalized_embeddings
    except Exception as e:
        print(f"Face detection failed for {image_path}: {e}")
        return []

def add_embedding_to_index(event_id: str, media_id: str, embedding: list):
    """Add a face embedding to the FAISS index for a specific event."""
    index, mapping = get_event_index(event_id)
    
    # FAISS expects numpy arrays of type float32
    embedding_np = np.array([embedding]).astype('float32')
    
    # Add to FAISS index
    faiss_id = index.ntotal
    index.add(embedding_np)
    
    # Store the mapping from faiss_id to our database media_id
    mapping[faiss_id] = str(media_id)

def find_matching_photos(event_id: str, target_embedding: list, threshold: float = 0.25):
    """
    Searches the FAISS index for vectors close to the target_embedding.
    Returns a list of media_ids.
    """
    if event_id not in _indices:
        return []
        
    index, mapping = get_event_index(event_id)
    if index.ntotal == 0:
        return []
        
    embedding_np = np.array([target_embedding]).astype('float32')
    
    # Search for the top 100 closest faces
    distances, indices = index.search(embedding_np, k=min(100, index.ntotal))
    
    import logging
    logger = logging.getLogger("uvicorn.error")
    matched_media_ids = []
    # distances and indices are 2D arrays, we look at the first row [0]
    # For IndexFlatIP, distance is actually Cosine Similarity [-1, 1], so HIGHER is better.
    logger.info("FAISS Search Results (Cosine Similarity, ID):")
    for sim, idx in zip(distances[0], indices[0]):
        logger.info(f"- Similarity: {sim:.4f}, FAISS ID: {idx}")
        if sim > threshold and idx != -1:
            matched_media_ids.append(mapping[idx])
            
    return matched_media_ids
