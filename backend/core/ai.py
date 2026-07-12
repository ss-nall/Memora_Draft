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
        _indices[event_id] = faiss.IndexFlatL2(512)
        _id_mappings[event_id] = {}
    return _indices[event_id], _id_mappings[event_id]

def extract_face_embedding(image_path: str):
    """
    Extracts a 512-dimensional face embedding using InsightFace.
    Returns None if no face is found.
    """
    try:
        # Read the image using OpenCV
        img = cv2.imread(image_path)
        if img is None:
            return None
            
        faces = app.get(img)
        if len(faces) > 0:
            # We take the first face found for simplicity in MVP
            return faces[0].embedding
        return None
    except Exception as e:
        print(f"Face detection failed for {image_path}: {e}")
        return None

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

def find_matching_photos(event_id: str, target_embedding: list, threshold: float = 1.0):
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
    
    matched_media_ids = []
    # distances and indices are 2D arrays, we look at the first row [0]
    for dist, idx in zip(distances[0], indices[0]):
        if dist < threshold and idx != -1:
            matched_media_ids.append(mapping[idx])
            
    return matched_media_ids
