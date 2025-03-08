# PDF Highlighter

A React application that allows users to upload PDF files and highlight content based on JSON data.

## Features

- Upload and view PDF files
- Apply highlights to PDFs using JSON data
- Sample JSON highlight format provided
- Interactive PDF viewer with highlighting capabilities

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository or download the source code
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
# or
yarn install
```

4. Start the development server:

```bash
npm start
# or
yarn start
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## JSON Format

The application expects JSON data in the following format (based on pay stubs data):

```json
{
  "pay_stubs": {
    "employee": {
      "value": "Employee Name",
      "position": {
        "page_number": 1,
        "x": 0.166,
        "y": 0.53,
        "width": 180,
        "height": 18,
        "left": 16.6,
        "top": 53
      }
    },
    "employer": {
      "value": "Employer Name",
      "position": {
        "page_number": 1,
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
          "page_number": 1,
          "x": 0.66,
          "y": 0.43,
          "width": 100,
          "height": 15,
          "left": 66,
          "top": 43
        }
      },
      "gross_pay": {
        "value": 4440,
        "position": {
          "page_number": 1,
          "x": 0.5,
          "y": 0.78,
          "width": 80,
          "height": 15,
          "left": 50,
          "top": 78
        }
      }
      // Other payment fields...
    }
    // Other data fields...
  }
}
```

Key structure requirements:

1. The JSON must have a top-level `pay_stubs` object
2. Each field that should be highlighted needs a `position` object with:
   - `page_number`: The page number (1-based index)
   - Position can be specified in two ways:
     - As percentages: `x` and `y` values between 0-1 representing percentage of page dimensions
     - As absolute coordinates: `left`, `top`, `width`, and `height` values in points

The application automatically color-codes different field types:
- Employee data: Yellow
- Employer data: Light green
- Payment data: Light blue
- YTD data: Light salmon

## Dependencies

- React
- pdfjs-dist - Direct PDF rendering

## License

MIT
