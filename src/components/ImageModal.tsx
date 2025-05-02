import React from 'react';
import styled from '@emotion/styled';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75); /* Semi-transparent black background */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Ensure it's above other content */
`;

const ModalContent = styled.div`
  position: relative;
  max-width: 90vw; /* Max width relative to viewport width */
  max-height: 90vh; /* Max height relative to viewport height */
  background-color: #fff; /* Optional: if you want a background behind the image */
  padding: 10px; /* Optional: padding around the image */
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  border-radius: 4px; /* Optional: rounded corners */
`;

const ModalImage = styled.img`
  display: block;
  max-width: 100%;
  max-height: 85vh; /* Slightly less than content to allow for padding/close button */
  object-fit: contain; /* Scale image down to fit, preserving aspect ratio */
`;

const CloseButton = styled.button`
  position: absolute;
  top: -15px; /* Position slightly outside the top-right */
  right: -15px;
  background-color: #333;
  color: white;
  border: 2px solid white;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  font-size: 18px;
  line-height: 26px;
  text-align: center;
  cursor: pointer;
  z-index: 1010; /* Above the image */

  &:hover {
    background-color: #555;
  }
`;

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  // Stop propagation when clicking inside the content to prevent closing
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handler for the overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from reaching underlying elements
    onClose(); // Call the original close handler
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}> {/* Use the new handler */}
      <ModalContent onClick={handleContentClick}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <ModalImage src={imageUrl} alt="Full size view" />
      </ModalContent>
    </ModalOverlay>
  );
};

export default ImageModal;
