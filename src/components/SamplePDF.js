import React from 'react';

const SamplePDF = ({ onLoadSample }) => {
  const handleLoadSamplePDF = () => {
    // Create a simple sample PDF with text content
    fetch('https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf')
      .then(response => response.blob())
      .then(blob => {
        // Create a File object from the blob
        const file = new File([blob], 'sample.pdf', { type: 'application/pdf' });
        onLoadSample(file);
      })
      .catch(error => {
        console.error('Error loading sample PDF:', error);
        alert('Failed to load sample PDF. Please check your internet connection and try again.');
      });
  };

  return (
    <button 
      onClick={handleLoadSamplePDF}
      style={{ 
        backgroundColor: '#4CAF50',
        color: 'white',
        padding: '8px 16px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginLeft: '10px'
      }}
    >
      Load Sample PDF
    </button>
  );
};

export default SamplePDF;
