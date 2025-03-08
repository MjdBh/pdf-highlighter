import React, { useState } from 'react';

const JSONInput = ({ onJSONSubmit }) => {
  const [jsonText, setJsonText] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Sample JSON format from pay stubs data
  const sampleJSON = {
    "pay_stubs": {
      "employee": {
        "value": "El Fadl Fadil Daissaoui",
        "position": {
          "page_number": 4,
          "x": 0.166,
          "y": 0.53,
          "width": 180,
          "height": 18,
          "left": 16.6,
          "top": 53
        }
      },
      "employer": {
        "value": "Peace River Center",
        "position": {
          "page_number": 4,
          "x": 0.166,
          "y": 0.43,
          "width": 150,
          "height": 18,
          "left": 16.6,
          "top": 43
        }
      },
      "payment": {
        "pay_period": {
          "start_date": "2024-10-27",
          "end_date": "2024-11-09",
          "position": {
            "page_number": 4,
            "x": 0.66,
            "y": 0.43,
            "width": 100,
            "height": 15,
            "left": 66,
            "top": 43
          }
        },
        "pay_period_cycle": {},
        "gross_pay": {
          "value": 4440,
          "position": {
            "page_number": 4,
            "x": 0.5,
            "y": 0.78,
            "width": 80,
            "height": 15,
            "left": 50,
            "top": 78
          }
        },
        "annual_gross_pay": {},
        "pay_date": {
          "value": "2024-11-15",
          "position": {
            "page_number": 4,
            "x": 0.66,
            "y": 0.4,
            "width": 100,
            "height": 15,
            "left": 66,
            "top": 40
          }
        },
        "hourly_rate": {}
      },
      "ytd": {
        "ytd_gross_pay": 92376.47,
        "ytd_gross_pay_period": {
          "start_date": "2024-01-01",
          "end_date": "2024-11-15"
        },
        "position": {
          "page_number": 4,
          "x": 0.7,
          "y": 0.78,
          "width": 80,
          "height": 15,
          "left": 70,
          "top": 78
        }
      },
      "annual_income_estimation": {
        "value": 105343,
        "confidence_level": "medium",
        "reason": "The ytd section shows a ytd_gross_pay of $92,376.47 received between 2024-01-01 and 2024-11-15, which is a 320‐day span. Dividing $92,376.47 by 320 gives a daily rate of roughly $288.68. Projecting that rate to 365 days yields about $105,343 annually. Although the current pay period (with gross_pay $4440 over 14 days) computes to a slightly higher annual rate, the ytd_gross_pay projection is prioritized; the difference may indicate a recent pay change or irregularity, so the overall confidence level is medium."
      }
    }
  };

  const handleJSONChange = (e) => {
    setJsonText(e.target.value);
    setMessage({ text: '', type: '' });
  };

  const handleSubmit = () => {
    try {
      if (!jsonText.trim()) {
        setMessage({ text: 'Please enter JSON data', type: 'error' });
        return;
      }

      const parsedJSON = JSON.parse(jsonText);
      
      // Validate that it's an object with the expected structure
      if (typeof parsedJSON !== 'object' || parsedJSON === null || !('pay_stubs' in parsedJSON)) {
        setMessage({ text: 'JSON data should contain a pay_stubs object', type: 'error' });
        return;
      }

      onJSONSubmit(parsedJSON);
      // Count how many highlightable fields we found
      let fieldCount = 0;
      
      // Count fields with position data
      if (parsedJSON.pay_stubs) {
        const { pay_stubs } = parsedJSON;
        
        // Count top-level fields with position data
        Object.entries(pay_stubs).forEach(([field, data]) => {
          if (field === 'payment') {
            // Count nested payment fields
            Object.entries(data).forEach(([_, subData]) => {
              if (subData.position) fieldCount++;
            });
          } else if (data.position) {
            fieldCount++;
          }
        });
      }
      
      setMessage({ 
        text: `JSON data successfully processed with ${fieldCount} highlightable fields`, 
        type: 'success' 
      });
    } catch (error) {
      setMessage({ text: `Error parsing JSON: ${error.message}`, type: 'error' });
    }
  };

  const loadSampleJSON = () => {
    setJsonText(JSON.stringify(sampleJSON, null, 2));
  };

  return (
    <div className="json-input">
      <label>
        Enter JSON Highlight Data:
        <textarea
          value={jsonText}
          onChange={handleJSONChange}
          placeholder={`Enter JSON highlight data or click "Load Sample" to see an example...`}
        />
      </label>
      <div>
        <button onClick={handleSubmit}>Apply Highlights</button>
        <button 
          onClick={loadSampleJSON}
          style={{ marginLeft: '10px', backgroundColor: '#2196F3' }}
        >
          Load Sample
        </button>
      </div>
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default JSONInput;
