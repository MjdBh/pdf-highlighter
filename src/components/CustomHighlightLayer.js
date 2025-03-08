import React, { useState, useEffect } from 'react';

const CustomHighlightLayer = ({ highlights, pageIndex, pageWidth, pageHeight }) => {
  const [renderedHighlights, setRenderedHighlights] = useState([]);

  useEffect(() => {
    // Filter highlights that belong to the current page
    const filteredHighlights = highlights.filter(
      highlight => highlight.position.pageIndex === pageIndex
    );

    setRenderedHighlights(filteredHighlights);
  }, [highlights, pageIndex]);

  if (!renderedHighlights.length) return null;

  return (
    <div className="custom-highlight-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {renderedHighlights.map((highlight) => {
        const { id, position, color, content } = highlight;
        const { boundingRect } = position;

        // Scale coordinates to the current page size if using percentage coordinates
        const scaledRect = {
          x1: boundingRect.x1,
          y1: boundingRect.y1,
          x2: boundingRect.x2,
          y2: boundingRect.y2,
          width: boundingRect.width,
          height: boundingRect.height,
        };

        return (
          <div
            key={id}
            title={content.text || 'Highlight'}
            style={{
              position: 'absolute',
              left: `${scaledRect.x1}px`,
              top: `${scaledRect.y1}px`,
              width: `${scaledRect.width}px`,
              height: `${scaledRect.height}px`,
              backgroundColor: color || '#FFFF00',
              opacity: 0.3,
              borderRadius: '2px',
              pointerEvents: 'auto',
              cursor: 'pointer',
            }}
          />
        );
      })}
    </div>
  );
};

export default CustomHighlightLayer;
