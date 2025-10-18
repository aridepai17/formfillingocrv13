# Form Label Extractor

A sophisticated Next.js application that leverages advanced OCR technology and computer vision techniques to automatically extract form labels from images with high accuracy and confidence scoring.

## 🚀 Features

- **Advanced Image Preprocessing**: Contrast enhancement, Otsu thresholding, despeckling, and morphological operations
- **Spatial OCR Analysis**: Tesseract.js integration with TSV output for precise label positioning
- **Form Type Detection**: Intelligent classification of forms (Hospital, Hostel, College, Government, Medical, Application)
- **Confidence Scoring**: Multi-factor confidence assessment for extracted labels
- **Real-time Processing Pipeline**: Visual feedback during image processing stages
- **Export Capabilities**: Download results in TXT or JSON formats
- **Modern UI**: Responsive design with Tailwind CSS and Lucide React icons

## 🏗️ Architecture

### Frontend Architecture

```
app/
├── layout.tsx          # Root layout with global CSS import
├── page.tsx            # Main application component
├── globals.css         # Global styles and Tailwind directives
└── api/
    └── extract-labels/
        └── route.ts    # Backend API endpoint for OCR processing

components/
├── form-uploader.tsx       # Drag & drop file upload component
├── processing-pipeline.tsx # Visual processing stages display
└── results-display.tsx     # Extracted labels and results display
```

### Backend Architecture

The application uses Next.js API routes for server-side processing:

- **Image Preprocessing Pipeline**: Canvas-based image manipulation
- **OCR Engine**: Tesseract.js with spatial analysis
- **Form Classification**: Keyword and pattern matching algorithms
- **Confidence Scoring**: Multi-factor assessment system

## 🔄 How It Works

### 1. Image Upload & Validation
- User uploads an image via drag & drop or file selection
- Client-side validation ensures proper image format
- Image data is converted to base64 for processing

### 2. Image Preprocessing Pipeline
```typescript
// Advanced preprocessing stages:
1. Grayscale conversion
2. Contrast enhancement (histogram stretching)
3. Gaussian blur for noise reduction
4. Otsu's adaptive thresholding
5. Despeckling (noise removal)
6. Morphological operations (erosion + dilation)
```

### 3. Spatial OCR Analysis
- Tesseract.js processes the preprocessed image
- TSV (Tab-Separated Values) output provides spatial coordinates
- Words are grouped into lines based on Y-coordinates
- Label detection using pattern matching

### 4. Form Type Detection
The system analyzes extracted text against predefined form configurations:

```typescript
const FORM_TYPE_CONFIGS = {
  hospital: { keywords: ["patient", "doctor", "medical"], ... },
  hostel: { keywords: ["hostel", "room", "warden"], ... },
  college: { keywords: ["student", "course", "semester"], ... },
  // ... additional form types
}
```

### 5. Confidence Scoring
Multi-factor confidence assessment:
- Base OCR confidence
- Spatial analysis bonus (+30 points)
- Form type keyword matches (+15-20 points)
- Label pattern validation (+5-10 points)
- Length and format validation (+5 points)

### 6. Results Display & Export
- Real-time processing pipeline visualization
- Confidence-based color coding (green/yellow/red)
- Export functionality for TXT and JSON formats
- Raw OCR text inspection

## 🛠️ Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Modern icon library
- **React Hooks**: State management

### Backend & Processing
- **Tesseract.js**: OCR engine with spatial analysis
- **Canvas API**: Image manipulation and preprocessing
- **Next.js API Routes**: Server-side processing

### Development Tools
- **ESLint**: Code linting
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd formfillingv13
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Tailwind CSS
The application uses Tailwind CSS v3 with custom configuration:
- Content paths configured for `app/`, `components/`, and `pages/` directories
- Custom color scheme with dark theme support
- Responsive design utilities

### TypeScript
- Modern module resolution (`bundler`)
- Strict type checking enabled
- Next.js plugin integration

## 📊 Performance Considerations

### Image Processing
- Automatic scaling for large images (max 2000px)
- Efficient canvas operations
- Memory management for image data

### OCR Optimization
- Preprocessing reduces OCR processing time
- Spatial analysis improves accuracy
- Confidence scoring reduces false positives

## 🎯 Use Cases

- **Document Digitization**: Convert paper forms to structured data
- **Form Analysis**: Extract field labels for automated form filling
- **Data Entry Automation**: Reduce manual data entry workload
- **Compliance Documentation**: Process regulatory and legal forms
- **Educational Forms**: Handle student enrollment and academic forms

## 🔍 API Reference

### POST `/api/extract-labels`

Extracts form labels from uploaded images.

**Request Body:**
```json
{
  "imageData": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "labels": ["Name", "Email", "Phone"],
  "confidenceScores": {
    "Name": 95,
    "Email": 87,
    "Phone": 92
  },
  "formType": "application",
  "processingStages": [...]
}
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tesseract.js**: OCR engine and spatial analysis
- **Next.js Team**: Framework and tooling
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide**: Beautiful icon library

## 📞 Support

For support, email support@example.com or create an issue in the repository.

---

**Built with ❤️ using Next.js, TypeScript, and Tesseract.js**
