import React from 'react';
import styled from '@emotion/styled';

interface ImageTilesProps {
  imageUrls: string[];
  onDelete: (imageUrl: string) => void;
  onImageClick: (imageUrl: string) => void;
}

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const ImageTile = styled.div`
  cursor: pointer;
  position: relative;
  width: 100px;
  height: 100px;
  overflow: hidden;
  border: 1px solid #ccc;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 2px;
  right: 2px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 14px;
  line-height: 18px;
  text-align: center;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

const ImageTiles: React.FC<ImageTilesProps> = ({ imageUrls, onDelete, onImageClick }) => {
  return (
    <Container>
      {imageUrls.map((url) => (
        <ImageTile key={url} onClick={() => onImageClick(url)}>
          <img src={url} alt="Uploaded content" />
          <DeleteButton onClick={(e) => {
            e.stopPropagation();
            onDelete(url);
          }}>
            &times;
          </DeleteButton>
        </ImageTile>
      ))}
    </Container>
  );
};

export default ImageTiles;
