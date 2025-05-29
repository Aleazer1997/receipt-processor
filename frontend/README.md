# Receipt Processing System - Frontend

A modern Next.js frontend application for processing scanned receipts. This application provides a user-friendly interface to interact with your receipt processing APIs.

## Features

- **File Upload Interface**: Upload PDF receipt files with validation
- **Real-time Status Updates**: Track file validation and processing status
- **Receipt Management**: View and manage all processed receipts
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Comprehensive error handling with user-friendly messages

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **HTTP Client**: Axios for API communication
- **Icons**: Lucide React
- **Notifications**: Toast notifications for user feedback

## API Integration

The frontend expects the following API endpoints to be available:

### POST /api/upload
Upload a PDF receipt file.
- **Request**: FormData with 'file' field
- **Response**: `{ success: true, fileId: number, filename: string }`

### POST /api/validate
Validate an uploaded PDF file.
- **Request**: `{ fileId: number }`
- **Response**: `{ success: true, isValid: boolean, reason?: string }`

### POST /api/process
Extract data from a validated receipt.
- **Request**: `{ fileId: number }`
- **Response**: `{ success: true, extractedData: object }`

### GET /api/receipts
List all processed receipts.
- **Response**: Array of receipt objects

### GET /api/receipts/[id]
Get specific receipt details.
- **Response**: Single receipt object

### GET /api/receipt-files
List all uploaded files.
- **Response**: Array of file objects

## Setup Instructions

1. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Run Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`

3. **Access Application**
   Open http://localhost:3000 in your browser

## Usage

### Upload Tab
- Select PDF files using the file input
- View file information before uploading
- Upload files to your backend API

### Files Tab
- View all uploaded files with their status
- Validate PDF files
- Process validated files to extract data
- See processing status and error messages

### Receipts Tab
- Browse all successfully processed receipts
- View merchant names, amounts, and dates
- Click "View" to see detailed information

### Details Tab
- View comprehensive details of selected receipts
- See all extracted information including:
  - Receipt ID
  - Merchant name
  - Total amount
  - Purchase date
  - File path
  - Processing timestamps

## Component Structure

\`\`\`
app/
├── page.tsx              # Main application component
├── layout.tsx            # Root layout
└── globals.css           # Global styles

components/ui/            # shadcn/ui components
├── button.tsx
├── card.tsx
├── input.tsx
├── label.tsx
├── tabs.tsx
├── badge.tsx
└── ...

hooks/
├── use-toast.ts          # Toast notification hook
└── use-mobile.tsx        # Mobile detection hook
\`\`\`

## State Management

The application uses React's built-in state management:

- `selectedFile`: Currently selected file for upload
- `uploading`: Upload status
- `processing`: Processing status
- `receipts`: List of processed receipts
- `receiptFiles`: List of uploaded files
- `selectedReceipt`: Currently viewed receipt details

## Error Handling

- **File Validation**: Checks for PDF file type before upload
- **API Errors**: Displays specific error messages from API responses
- **Network Errors**: Handles connection issues gracefully
- **User Feedback**: Toast notifications for all operations

## Styling

The application uses:
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components
- **Responsive Design**: Mobile-first approach
- **Dark Mode Ready**: Components support dark mode

## API Response Formats

### Receipt Object
\`\`\`typescript
interface Receipt {
  id: number
  purchased_at: string
  merchant_name: string
  total_amount: number
  file_path: string
  created_at: string
}
\`\`\`

### Receipt File Object
\`\`\`typescript
interface ReceiptFile {
  id: number
  file_name: string
  file_path: string
  is_valid: boolean
  invalid_reason: string | null
  is_processed: boolean
  created_at: string
}
\`\`\`

## Customization

### Adding New Fields
To display additional receipt fields:

1. Update the interface definitions
2. Add new columns to the receipt display
3. Update the details view

### Styling Changes
- Modify Tailwind classes in components
- Update the theme in `tailwind.config.ts`
- Customize shadcn/ui component styles

### API Endpoints
- Update axios calls in the main component
- Modify request/response handling as needed
- Add new API endpoints following the same pattern

## Development

### Adding New Features
1. Create new components in appropriate directories
2. Add new state variables as needed
3. Implement API calls using axios
4. Add proper error handling and user feedback

### Testing
- Test file upload with various file types
- Verify error handling with invalid files
- Test responsive design on different screen sizes
- Validate API integration with your backend

## Deployment

1. **Build the Application**
   \`\`\`bash
   npm run build
   \`\`\`

2. **Start Production Server**
   \`\`\`bash
   npm start
   \`\`\`

3. **Environment Configuration**
   - Ensure API endpoints are accessible
   - Configure any necessary environment variables
   - Set up proper CORS if API is on different domain

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Lazy loading of receipt data
- Efficient re-rendering with React hooks
- Optimized bundle size with Next.js
- Fast navigation with client-side routing

## Security

- File type validation on frontend
- Proper error message handling
- No sensitive data stored in localStorage
- HTTPS recommended for production
