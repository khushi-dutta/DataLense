# DataLense

A modern web application that converts your data into beautiful visualizations and provides AI-powered insights.

## Features

- **Drag & Drop Data Import**: Easily upload CSV and Excel files
- **Multiple Chart Types**: Visualize your data with bar charts, line charts, pie charts, scatter plots, area charts, and radar charts
- **AI-Powered Insights**: Get automatic analysis of your data including trends, correlations, and outliers
- **Export Functionality**: Save your visualizations and insights as PDF reports
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Mode**: Choose your preferred theme

## Getting Started

### Prerequisites

- Node.js (v14.x or later)
- npm (v6.x or later)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/khushi-dutta/DataLense.git
   cd DataLense
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

1. **Upload Data**: Click the upload area or drag and drop a CSV/Excel file
2. **Visualize**: Your data will be automatically visualized as a chart
3. **Customize**: Select different chart types to see various visualizations
4. **Analyze**: Scroll down to see AI-generated insights about your data
   - Configure your Google Gemini API key for personalized AI insights
   - Trends, patterns, and anomalies will be automatically detected
5. **Export**: Click the "Export Complete Report" button to save a PDF containing all visualizations and insights

## Setting Up Google Gemini API

For enhanced AI insights, you need to configure a Google Gemini API key:

### For Local Development:

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key or use an existing one
4. Create a `.env.local` file in the root of the project with the following content:
   ```
   REACT_APP_GEMINI_API_KEY=your_actual_api_key_here
   ```

### For Deployment on Vercel:

1. Sign in to your Vercel account and open your project
2. Go to Settings → Environment Variables
3. Add a new environment variable:
   - NAME: `REACT_APP_GEMINI_API_KEY`
   - VALUE: Your Google Gemini API Key
4. Redeploy your application

Your API key is stored securely and never committed to your repository.

## Technologies Used

- React.js with TypeScript
- Material UI for components and styling
- Chart.js for data visualization
- Papa Parse for CSV parsing
- SheetJS for Excel file processing
- Google Gemini API for AI-powered insights
- jsPDF and html2canvas for PDF exports

## Project Structure

```
datalense/
├── public/              # Public assets
├── src/                 # Source files
│   ├── components/      # React components
│   ├── services/        # Service modules
│   ├── types/           # TypeScript definitions
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main application component
│   └── index.tsx        # Application entry point
├── package.json         # Project dependencies
└── README.md            # Project documentation
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with ❤️ by Khushi Dutta
