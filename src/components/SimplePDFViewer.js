import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set the PDF.js worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

const SimplePDFViewer = ({ pdfFile, highlights }) => {
  const [pdfDocument, setPdfDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pageViewports, setPageViewports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1.0);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [showPositionDetails, setShowPositionDetails] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Selection mode states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [userHighlights, setUserHighlights] = useState([]);
  
  const canvasRef = useRef(null);
  const pdfContainerRef = useRef(null);
  
  // Load the PDF when the file changes
  useEffect(() => {
    if (!pdfFile) return;
    
    setLoading(true);
    
    const loadPdf = async () => {
      try {
        const fileReader = new FileReader();
        
        fileReader.onload = async function() {
          const typedArray = new Uint8Array(this.result);
          
          // Load the PDF document
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          setPdfDocument(pdf);
          setNumPages(pdf.numPages);
          
          // Store viewport information for each page
          const viewports = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.0 });
            viewports.push(viewport);
          }
          setPageViewports(viewports);
          
          setLoading(false);
        };
        
        fileReader.readAsArrayBuffer(pdfFile);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setLoading(false);
      }
    };
    
    loadPdf();
  }, [pdfFile]);
  
  // Render the current page when it changes or when the pdf document changes
  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;
    
    const renderPage = async () => {
      try {
        // Get the page
        const page = await pdfDocument.getPage(currentPage);
        
        // Get the canvas context
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        // Calculate viewport with current scale
        const viewport = page.getViewport({ scale });
        
        // Set canvas dimensions to match the viewport
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render the page
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        await page.render(renderContext).promise;
      } catch (error) {
        console.error('Error rendering PDF page:', error);
      }
    };
    
    renderPage();
  }, [pdfDocument, currentPage, scale]);
  
  // Functions to navigate through pages
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const goToNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  // Function to zoom in and out
  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  };
  
  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };
  
  // Filter highlights for the current page (adjust for 0-based index)
  const currentPageHighlights = highlights.filter(
    highlight => highlight.position.pageIndex === currentPage - 1
  );
  
  // Calculate highlight positions based on the current viewport and scale
  const getScaledPosition = (highlight) => {
    if (!pageViewports[currentPage - 1]) return null;
    
    const viewport = pageViewports[currentPage - 1];
    const { left, top, width, height } = highlight.position;
    
    // Convert percentage to actual pixels based on the viewport dimensions
    return {
      left: (left / 100) * viewport.width * scale,
      top: (top / 100) * viewport.height * scale,
      width: (width / 100) * viewport.width * scale,
      height: (height / 100) * viewport.height * scale,
    };
  };

  // Handle mouse events for selection
  const handleMouseDown = (e) => {
    if (!isSelectionMode || !canvasRef.current || !pageViewports[currentPage - 1]) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // Get position relative to the canvas
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;
    
    // Convert to percentage of viewport dimensions
    const viewport = pageViewports[currentPage - 1];
    const percentX = (x / (viewport.width * scale)) * 100;
    const percentY = (y / (viewport.height * scale)) * 100;
    
    setSelectionStart({ x: percentX, y: percentY });
  };
  
  const handleMouseMove = (e) => {
    if (!isSelectionMode || !selectionStart || !canvasRef.current || !pageViewports[currentPage - 1]) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    // Get position relative to the canvas
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;
    
    // Convert to percentage of viewport dimensions
    const viewport = pageViewports[currentPage - 1];
    const percentX = (x / (viewport.width * scale)) * 100;
    const percentY = (y / (viewport.height * scale)) * 100;
    
    setSelectionEnd({ x: percentX, y: percentY });
  };
  
  const handleMouseUp = (e) => {
    if (!isSelectionMode || !selectionStart || !selectionEnd || !pageViewports[currentPage - 1]) return;
    
    // Calculate the selection rectangle (ensuring positive width/height)
    const left = Math.min(selectionStart.x, selectionEnd.x);
    const top = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);
    
    // Only create a highlight if it has some size
    if (width > 0.5 && height > 0.5) {
      const newHighlight = {
        id: `user-highlight-${userHighlights.length + 1}`,
        content: {
          text: `Selection ${userHighlights.length + 1}`,
        },
        position: {
          pageIndex: currentPage - 1,
          left,
          top,
          width,
          height,
        },
        color: '#FFCC00',
        isUserCreated: true
      };
      
      setUserHighlights([...userHighlights, newHighlight]);
      console.log('Created highlight:', newHighlight);
    }
    
    // Reset selection
    setSelectionStart(null);
    setSelectionEnd(null);
  };
  
  // Export highlights to JSON
  const exportHighlights = () => {
    const data = userHighlights.map(h => ({
      id: h.id,
      position: {
        page_number: h.position.pageIndex + 1, // Convert to 1-based
        left: h.position.left / 100, // Convert to 0-1 range
        top: h.position.top / 100,   // Convert to 0-1 range
        width: h.position.width / 100, // Convert to 0-1 range
        height: h.position.height / 100 // Convert to 0-1 range
      }
    }));
    
    // Format the data as JSON with indentation
    const jsonData = JSON.stringify(data, null, 2);
    
    // Create a blob with the JSON data
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    // Create an object URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a download link and click it
    const a = document.createElement('a');
    a.href = url;
    a.download = 'highlights.json';
    a.click();
    
    // Clean up by revoking the object URL
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="simple-pdf-viewer">
      {loading ? (
        <div className="loading">Loading PDF...</div>
      ) : (
        <div>
          <div className="toolbar">
            <button onClick={goToPreviousPage} disabled={currentPage <= 1}>
              Previous
            </button>
            <span>
              Page {currentPage} of {numPages}
            </span>
            <button onClick={goToNextPage} disabled={currentPage >= numPages}>
              Next
            </button>
            <button onClick={zoomOut}>Zoom -</button>
            <button onClick={zoomIn}>Zoom +</button>
            <button 
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              style={{
                marginLeft: '20px',
                backgroundColor: isSelectionMode ? '#4CAF50' : '#f1f1f1',
                color: isSelectionMode ? 'white' : 'black',
              }}
            >
              {isSelectionMode ? 'Exit Selection Mode' : 'Selection Mode'}
            </button>
            <label style={{ marginLeft: '20px', display: 'flex', alignItems: 'center' }}>
              <input 
                type="checkbox" 
                checked={showDebugInfo} 
                onChange={() => setShowDebugInfo(!showDebugInfo)} 
                style={{ marginRight: '5px' }}
              />
              Debug Mode
            </label>
            <label style={{ marginLeft: '20px', display: 'flex', alignItems: 'center' }}>
              <input 
                type="checkbox" 
                checked={showPositionDetails} 
                onChange={() => setShowPositionDetails(!showPositionDetails)} 
                style={{ marginRight: '5px' }}
              />
              Show Position Details
            </label>
          </div>
          
          <div 
            className="pdf-container" 
            style={{ position: 'relative' }}
            ref={pdfContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <canvas ref={canvasRef} />
            
            {/* Highlight Layer */}
            <div className="highlight-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              {/* Imported highlights */}
              {currentPageHighlights.map((highlight) => {
                const position = getScaledPosition(highlight);
                if (!position) return null;
                
                return (
                  <div
                    key={highlight.id}
                    title={showDebugInfo ? '' : highlight.content.text || 'Highlight'}
                    style={{
                      position: 'absolute',
                      left: `${position.left}px`,
                      top: `${position.top}px`,
                      width: `${position.width}px`,
                      height: `${position.height}px`,
                      backgroundColor: highlight.color || '#FFFF00',
                      opacity: 0.3,
                      borderRadius: '2px',
                      pointerEvents: 'auto',
                      cursor: 'pointer',
                      zIndex: 1000,
                      border: showDebugInfo ? '1px dashed red' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      setActiveHighlight(highlight);
                      setTooltipPosition({ 
                        x: e.clientX, 
                        y: e.clientY 
                      });
                    }}
                    onMouseLeave={() => setActiveHighlight(null)}
                  >
                    {(showDebugInfo || showPositionDetails) && (
                      <div style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        background: showDebugInfo ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)',
                        color: showDebugInfo ? 'white' : '#333',
                        padding: '4px 6px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 1001,
                        border: showPositionDetails ? '1px solid #ccc' : 'none',
                        boxShadow: showPositionDetails ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                        borderRadius: '3px',
                      }}>
                        {showDebugInfo && (
                          <div style={{ marginBottom: '2px', fontWeight: 'bold' }}>
                            {highlight.id}
                          </div>
                        )}
                        {(showDebugInfo || showPositionDetails) && (
                          <div>
                            <div>
                              <span style={{ display: 'inline-block', width: '35px' }}>Left:</span> 
                              <strong>{highlight.position.left.toFixed(1)}%</strong>
                            </div>
                            <div>
                              <span style={{ display: 'inline-block', width: '35px' }}>Top:</span> 
                              <strong>{highlight.position.top.toFixed(1)}%</strong>
                            </div>
                            <div>
                              <span style={{ display: 'inline-block', width: '35px' }}>Width:</span> 
                              <strong>{highlight.position.width.toFixed(1)}%</strong>
                            </div>
                            <div>
                              <span style={{ display: 'inline-block', width: '35px' }}>Height:</span> 
                              <strong>{highlight.position.height.toFixed(1)}%</strong>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* User-created highlights */}
              {userHighlights
                .filter(highlight => highlight.position.pageIndex === currentPage - 1)
                .map((highlight) => {
                  const position = getScaledPosition(highlight);
                  if (!position) return null;
                  
                  return (
                    <div
                      key={highlight.id}
                      style={{
                        position: 'absolute',
                        left: `${position.left}px`,
                        top: `${position.top}px`,
                        width: `${position.width}px`,
                        height: `${position.height}px`,
                        backgroundColor: highlight.color || '#FFCC00',
                        opacity: 0.3,
                        borderRadius: '2px',
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        zIndex: 1000,
                        border: '1px solid rgba(255, 153, 0, 0.5)',
                      }}
                      onMouseEnter={(e) => {
                        setActiveHighlight(highlight);
                        setTooltipPosition({ 
                          x: e.clientX, 
                          y: e.clientY 
                        });
                      }}
                      onMouseLeave={() => setActiveHighlight(null)}
                    >
                      {(showDebugInfo || showPositionDetails || true) && (
                        <div style={{
                          position: 'absolute',
                          top: '0',
                          left: '0',
                          background: 'rgba(255,255,255,0.9)',
                          color: '#333',
                          padding: '4px 6px',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          whiteSpace: 'nowrap',
                          pointerEvents: 'none',
                          zIndex: 1001,
                          border: '1px solid #ccc',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          borderRadius: '3px',
                        }}>
                          <div>
                            <div>
                              <span style={{ display: 'inline-block', width: '35px' }}>Left:</span> 
                              <strong>{highlight.position.left.toFixed(1)}%</strong>
                            </div>
                            <div>
                              <span style={{ display: 'inline-block', width: '35px' }}>Top:</span> 
                              <strong>{highlight.position.top.toFixed(1)}%</strong>
                            </div>
                            <div>
                              <span style={{ display: 'inline-block', width: '35px' }}>Width:</span> 
                              <strong>{highlight.position.width.toFixed(1)}%</strong>
                            </div>
                            <div>
                              <span style={{ display: 'inline-block', width: '35px' }}>Height:</span> 
                              <strong>{highlight.position.height.toFixed(1)}%</strong>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              
              {/* Active selection box */}
              {isSelectionMode && selectionStart && selectionEnd && pageViewports[currentPage - 1] && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${Math.min(selectionStart.x, selectionEnd.x) * pageViewports[currentPage - 1].width * scale / 100}px`,
                    top: `${Math.min(selectionStart.y, selectionEnd.y) * pageViewports[currentPage - 1].height * scale / 100}px`,
                    width: `${Math.abs(selectionEnd.x - selectionStart.x) * pageViewports[currentPage - 1].width * scale / 100}px`,
                    height: `${Math.abs(selectionEnd.y - selectionStart.y) * pageViewports[currentPage - 1].height * scale / 100}px`,
                    backgroundColor: 'rgba(255, 204, 0, 0.3)',
                    border: '1px dashed #FF9900',
                    zIndex: 1000,
                  }}
                />
              )}
            </div>
          </div>
          
          {/* Export Button */}
          {userHighlights.length > 0 && (
            <div style={{ marginTop: '10px', textAlign: 'center' }}>
              <button 
                onClick={exportHighlights}
                style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                Export Highlights ({userHighlights.length})
              </button>
              <button 
                onClick={() => setUserHighlights([])}
                style={{ padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '10px' }}
              >
                Clear All
              </button>
            </div>
          )}
          
          {/* Tooltip */}
          {activeHighlight && (
            <div
              style={{
                position: 'fixed',
                left: `${tooltipPosition.x + 15}px`,
                top: `${tooltipPosition.y + 15}px`,
                padding: '8px 12px',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace',
                zIndex: 2000,
                maxWidth: '300px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                pointerEvents: 'none'
              }}
            >
              <div><strong>ID:</strong> {activeHighlight.id}</div>
              <div><strong>Text:</strong> {activeHighlight.content.text || 'N/A'}</div>
              <div><strong>Page:</strong> {activeHighlight.position.pageIndex + 1}</div>
              <div><strong>Position (%):</strong> left:{activeHighlight.position.left.toFixed(1)}, top:{activeHighlight.position.top.toFixed(1)}</div>
              <div>
                <strong>Size (%):</strong> w:{activeHighlight.position.width.toFixed(1)}, h:{activeHighlight.position.height.toFixed(1)}
              </div>
              {activeHighlight.note && (
                <div><strong>Note:</strong> {activeHighlight.note}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SimplePDFViewer;