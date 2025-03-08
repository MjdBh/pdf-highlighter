import React, { useState } from 'react';
import SimplePDFViewer from './components/SimplePDFViewer';
import JSONInput from './components/JSONInput';
import SamplePDF from './components/SamplePDF';
import './App.css';

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [highlightData, setHighlightData] = useState(null);
  const [processedHighlights, setProcessedHighlights] = useState([]);

  const handlePDFUpload = (file) => {
    setPdfFile(file);
  };

  const handleJSONData = (data) => {
    setHighlightData(data);
    
    // Process the JSON data into an array of highlights
    if (data && data.pay_stubs) {
      const { pay_stubs } = data;
      const formattedHighlights = [];
      
      // Helper function to convert position data to the highlight format
      const convertPosition = (field, data, fieldName) => {
        if (!data.position) return null;
        
        const { position } = data;
        const pageIndex = position.page_number - 1; // Adjusting to 0-based indexing
        
        // Calculate coordinates based on percentage or absolute values
        let x1, y1, x2, y2, width, height;
        
        // Normalize values to a 0-100 scale for consistency
        // Check if values are in decimal form (0-1 range) and convert them to 0-100 scale if needed
        let normalizedX = position.x;
        let normalizedY = position.y;
        let normalizedWidth = position.width || 0.1; // Default 10%
        let normalizedHeight = position.height || 0.02; // Default 2%
        
        // If values are provided as left/top instead of x/y
        if (position.left !== undefined) normalizedX = position.left;
        if (position.top !== undefined) normalizedY = position.top;
        
        // If the values are in 0-1 range (decimals), convert to 0-100 range
        if (normalizedX <= 1) normalizedX *= 100;
        if (normalizedY <= 1) normalizedY *= 100;
        if (normalizedWidth <= 1) normalizedWidth *= 100;
        if (normalizedHeight <= 1) normalizedHeight *= 100;
        
        // Set the coordinates
        x1 = normalizedX;
        y1 = normalizedY;
        width = normalizedWidth;
        height = normalizedHeight;
        x2 = x1 + width;
        y2 = y1 + height;
        
        // Create a standardized highlight position object
        return {
          id: `highlight-${field}-${fieldName || ''}`,
          content: {
            text: data.value ? String(data.value) : field,
          },
          position: {
            pageIndex: pageIndex,
            top: normalizedY,    // percentage from top
            left: normalizedX,   // percentage from left
            width: normalizedWidth, // percentage of page width
            height: normalizedHeight, // percentage of page height
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
      
      // Add some debug information
      console.log(`Processed ${formattedHighlights.length} highlights:`);
      formattedHighlights.forEach(h => {
        console.log(`  ${h.id}: page ${h.position.pageIndex + 1}, position (${h.position.left.toFixed(1)}%, ${h.position.top.toFixed(1)}%), size ${h.position.width.toFixed(1)}% x ${h.position.height.toFixed(1)}%`);
      });
      
      setProcessedHighlights(formattedHighlights);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>PDF Highlighter</h1>
      </header>
      <main className="App-content">
        <div className="upload-section">
          <h2>Upload PDF & JSON Data</h2>
          <div className="file-upload">
            <label>
              Select PDF:
              <input 
                type="file" 
                accept=".pdf" 
                onChange={(e) => {
                  if (e.target.files.length > 0) {
                    handlePDFUpload(e.target.files[0]);
                  }
                }}
              />
            </label>
            <SamplePDF onLoadSample={handlePDFUpload} />
          </div>
          <JSONInput onJSONSubmit={handleJSONData} />
        </div>

        <div className="viewer-section">
          {pdfFile && (
            <SimplePDFViewer 
              pdfFile={pdfFile} 
              highlights={processedHighlights} 
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
