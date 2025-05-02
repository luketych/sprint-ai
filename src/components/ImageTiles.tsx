import React, { useState, useCallback } from 'react';
import './ImageTiles.css'; // We'll create this CSS file later

interface ImageFile {
  file: File;
  previewUrl: string;
}

interface ImageTilesProps {
  onImageClick: (imageUrl: string) => void;
}

export function ImageTiles({ onImageClick }: ImageTilesProps) {
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const newImageFiles: ImageFile[] = [];
    const promises: Promise<void>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        setError(`File "${file.name}" is not a valid image type.`);
        continue; // Skip non-image files
      }

      const promise = new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImageFiles.push({ file: file, previewUrl: reader.result as string });
          resolve();
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      promises.push(promise);
    }

    Promise.all(promises)
      .then(() => {
        setImageFiles(prevFiles => [...prevFiles, ...newImageFiles]);
      })
      .catch(err => {
        console.error("Error reading files:", err);
        setError('Error reading files. Please try again.');
      });

    // Clear the input value to allow selecting the same file again
    event.target.value = '';

  }, []);

  const handleUpload = useCallback(async () => {
    if (imageFiles.length === 0) {
      setError('No images selected for upload.');
      return;
    }
    setError(null);
    console.log('Attempting to upload files:', imageFiles.map(f => f.file.name));

    const formData = new FormData();
    imageFiles.forEach((imageFile) => {
      formData.append('images', imageFile.file); // Key must match multer config: 'images'
    });

    try {
      const response = await fetch('/api/upload-images', { // Use the correct backend endpoint
        method: 'POST',
        body: formData,
        // Headers are not strictly necessary for FormData with fetch,
        // the browser sets Content-Type to multipart/form-data automatically
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Upload failed:', result);
        throw new Error(result.error || `Upload failed with status ${response.status}`);
      }

      console.log('Upload successful:', result);
      alert(`Successfully uploaded ${imageFiles.length} image(s)! Paths: ${result.paths?.join(', ')}`);
      setImageFiles([]); // Clear after successful upload
    } catch (err) {
      console.error('Error during upload:', err);
      setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [imageFiles]);

  return (
    <div className="image-tiles-container">
      <h2>Image Upload & Tiles</h2>
      {error && <div className="error" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      <div className="upload-controls">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }} // Hide default input
          id="image-upload-input"
        />
        <label htmlFor="image-upload-input" className="upload-button">
          Select Images
        </label>
        {imageFiles.length > 0 && (
          <button onClick={handleUpload} className="upload-button">
            Upload {imageFiles.length} Image(s)
          </button>
        )}
      </div>

      <div className="thumbnail-grid">
        {imageFiles.map((imageFile, index) => (
          <div key={index} className="thumbnail-item" style={{ cursor: 'pointer' }} onClick={() => onImageClick(imageFile.previewUrl)}>
            <img src={imageFile.previewUrl} alt={`Preview ${index}`} />
            {/* Optional: Display file name or other info */}
            {/* <p>{imageFile.file.name}</p> */}
          </div>
        ))}
      </div>
    </div>
  );
}
