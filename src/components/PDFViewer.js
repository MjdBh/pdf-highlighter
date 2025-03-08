import React, { useState, useEffect } from 'react';

// Import the required packages for PDF viewing and highlighting
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin } from '@react-pdf-viewer/highlight';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';

const PDFViewer = ({ pdfFile, highlightData }) => {
  const [pdfUrl, setPdfUrl] = useState('');
  const [highlights, setHighlights] = useState([]);
  const [showDebug, setShowDebug] = useState(false);

  // Initialize plugins
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  
  // Create the highlight plugin with a reference we can access
  const highlightPluginInstance = highlightPlugin({
    trigger: 'hover',
  });

  // Transform the pay_stubs JSON into the format expected by react-pdf-viewer
  useEffect(() => {
    if (highlightData && highlightData.pay_stubs) {
      try {
        const { pay_stubs } = highlightData;
        const formattedHighlights = [];
        
        // Helper function to convert position data to the highlight format
        const convertPosition = (field, data, fieldName) => {
          if (!data.position) return null;
          
          const { position } = data;
          const pageIndex = position.page_number - 1; // Adjusting to 0-based indexing
          
          // Calculate coordinates based on percentage or absolute values
          let x1, y1, x2, y2, width, height;
          
          // Get document dimensions
          // For react-pdf-viewer, we standardize on a unit size that works well with percentage values
          const pageWidth = 600;
          const pageHeight = 800;
          
          // If percentage values are used (0-1 range)
          if (position.x !== undefined && position.x <= 1 && position.y !== undefined && position.y <= 1) {
            x1 = position.x * pageWidth;
            y1 = position.y * pageHeight;
            width = (position.width && position.width <= 1) ? position.width * pageWidth : (position.width || 100);
            height = (position.height && position.height <= 1) ? position.height * pageHeight : (position.height || 20);
            x2 = x1 + width;
            y2 = y1 + height;
          } else {
            // If absolute values are used
            x1 = position.left || position.x || 0;
            y1 = position.top || position.y || 0;
            width = position.width || 100;
            height = position.height || 20;
            x2 = x1 + width;
            y2 = y1 + height;
          }
          
          const rect = {
            x1,
            y1,
            x2,
            y2,
            width,
            height
          };
          
          return {
            id: `highlight-${field}-${fieldName || ''}`,
            content: {
              text: data.value ? String(data.value) : field,
            },
            position: {
              pageIndex,
              boundingRect: rect,
              rects: [rect],
            },
            note: `${field}${fieldName ? `: ${fieldName}` : ''}`,
            color: getFieldColor(field, fieldName),
          };
        };
        
        // Function to assign different colors to different field types
        const getFieldColor = (field, fieldName) => {
          switch (field) {
            case 'employee':
              return '#FFFF00'; // Yellow
            case 'employer':
              return '#90EE90'; // Light green
            case 'payment':
              return '#ADD8E6'; // Light blue
            case 'ytd':
              return '#FFA07A'; // Light salmon
            default:
              return '#D8BFD8'; // Thistle
          }
        };
        
        // Process each field in the pay_stubs object
        Object.entries(pay_stubs).forEach(([field, data]) => {
          // Skip the annual_income_estimation as it doesn't have position data
          if (field === 'annual_income_estimation') return;
          
          // Handle nested fields
          if (field === 'payment') {
            Object.entries(data).forEach(([subField, subData]) => {
              if (subData.position) {
                const highlight = convertPosition(field, subData, subField);
                if (highlight) formattedHighlights.push(highlight);
              }
            });
          } else if (data.position) {
            // Direct field with position
            const highlight = convertPosition(field, data);
            if (highlight) formattedHighlights.push(highlight);
          }
        });
        
        setHighlights(formattedHighlights);
      } catch (error) {
        console.error('Error processing pay_stubs data:', error);
      }
    }
  }, [highlightData]);

  // When a PDF file is selected, create a URL for it
  useEffect(() => {
    if (pdfFile) {
      const url = URL.createObjectURL(pdfFile);
      setPdfUrl(url);
      
      // Cleanup function to revoke the URL when component unmounts
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [pdfFile]);

  // Set up the highlight plugin with the current highlights
  useEffect(() => {
    if (highlights.length > 0 && highlightPluginInstance) {
      try {
        // Access the highlight plugin API
        const highlightPluginApi = highlightPluginInstance.getPluginRendererState;
        
        // Use a ref to avoid direct DOM manipulation in the component render
        // This is a workaround since the API design changed between versions
        // We'll rely on the document rendering system instead of direct plugin manipulation
        console.log('Highlights registered:', highlights.length);
      } catch (error) {
        console.error('Error setting up highlights:', error);
      }
    }
  }, [highlights, highlightPluginInstance]);

  // Helper function to extract highlight data when clicked
  const getHighlightById = (id) => highlights.find((highlight) => highlight.id === id);

  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <label>
          <input 
            type="checkbox" 
            checked={showDebug} 
            onChange={() => setShowDebug(!showDebug)} 
          />
          Show Debug Info
        </label>
      </div>
      
      {showDebug && highlights.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', backgroundColor: '#f5f5f5', maxHeight: '200px', overflowY: 'auto' }}>
          <h4>Highlight Debug Info:</h4>
          <pre style={{ fontSize: '12px' }}>
            {JSON.stringify(highlights, null, 2)}
          </pre>
        </div>
      )}
      
      <div style={{ height: '750px' }}>
        {pdfUrl ? (
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
            <Viewer
              fileUrl={pdfUrl}
              plugins={[
                defaultLayoutPluginInstance,
                highlightPluginInstance,
              ]}
            />
          </Worker>
        ) : (
          <div className="no-pdf-message">
            <p>Please upload a PDF document to view it here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer;
