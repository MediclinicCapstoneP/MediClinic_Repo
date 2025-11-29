# Enhanced Chatbot System for IgabayCare

This directory contains the enhanced chatbot system copied and adapted from the mobile app (Igabay_app) to provide a comprehensive AI healthcare assistant for the web platform.

## Features

### 🤖 Core Functionality
- **AI-Powered Responses**: Intelligent responses using Groq API with fallback to local responses
- **Role-Based Interactions**: Different responses and suggestions for patients, doctors, and clinics
- **Emergency Detection**: Automatic detection of emergency keywords with immediate guidance
- **Context Awareness**: Maintains conversation context for better responses
- **Chat History Persistence**: Automatically saves and restores chat conversations per user
- **Clear History Option**: Users can clear their chat history with one click

### 🎨 User Interface
- **Modern Modal Design**: Clean, professional healthcare-themed interface
- **Floating Chat Button**: Accessible chat button with notification badges
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Minimize/Maximize**: Users can minimize the chat while keeping it accessible

### 🏥 Healthcare-Specific Features
- **Appointment Booking Guidance**: Step-by-step help for booking appointments
- **Medication Information**: General medication safety and guidance
- **Symptom Guidance**: General health information (not medical diagnosis)
- **Clinic Search Assistance**: Help finding appropriate healthcare providers

### 🔧 Technical Features
- **Supabase Integration**: Uses Supabase edge functions when available
- **Fallback System**: Local responses when edge functions are unavailable
- **TypeScript Support**: Full type safety throughout the system
- **Error Handling**: Comprehensive error handling and user feedback

## Components

### EnhancedChatbotModal
The main chat interface component that provides:
- Full-screen chat modal with message history
- Role-based welcome messages and suggestions
- Emergency keyword detection and response
- Real-time typing indicators
- Message timestamps and user avatars

**Props:**
- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Callback for closing the modal

### EnhancedFloatingChatButton
The floating chat button that provides:
- Fixed position chat button with solid blue styling
- Notification badge system for new messages
- Green indicator dot when chat history is saved
- Tooltip showing "Continue Chat" when history exists
- Minimize/maximize functionality
- Smart hiding on scroll and auth pages
- Hover effects and smooth transitions

**Props:**
- `className?: string` - Additional CSS classes

## Services

### enhancedChatbotService
The core service that handles:
- Message processing and AI responses
- Emergency detection
- Role-based response generation
- Supabase edge function integration
- Local fallback responses

**Key Methods:**
- `sendMessage(message, history, userId, userRole)` - Process user message and get AI response
- `isEmergencyMessage(message)` - Check for emergency keywords
- `getEmergencyResponse()` - Get emergency response text
- `getSuggestedTopics(userRole)` - Get role-specific quick questions

## Chat History Features

### Automatic Persistence
- Chat conversations are automatically saved to localStorage
- Each user's history is stored separately using their user ID
- Anonymous users get a shared "anonymous" storage key
- History is preserved across browser sessions

### Visual Indicators
- **Green dot** on floating button indicates saved history exists
- **Tooltip** changes to "Continue Chat (History Saved)" when history exists
- **Clear History button** appears in chat header when there are previous messages

### History Management
- **Clear History**: Users can clear their entire chat history with one click
- **Automatic Loading**: Previous conversations are restored when opening the chat
- **Context Preservation**: The AI can reference previous messages for better responses

### Storage Details
```javascript
// Storage key format
localStorage.getItem(`chatbot_history_${userId}`)

// Data structure
[
  {
    id: string,
    userId: string,
    message: string,
    isBot: boolean,
    timestamp: string
  }
]
```

## Usage

### Basic Implementation
```tsx
import { EnhancedFloatingChatButton } from '@/components/chatbot';

function App() {
  return (
    <div>
      {/* Your app content */}
      <EnhancedFloatingChatButton />
    </div>
  );
}
```

### Custom Implementation
```tsx
import { EnhancedChatbotModal } from '@/components/chatbot';

function CustomChatPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <EnhancedChatbotModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
    />
  );
}
```

## Emergency Response System

The chatbot includes comprehensive emergency detection for keywords like:
- "emergency", "chest pain", "difficulty breathing"
- "severe bleeding", "unconscious", "heart attack"
- "stroke", "call 911", "urgent care"

When detected, the chatbot immediately provides:
- Emergency contact information (Philippines: 911 or 166)
- Clear guidance to seek immediate medical care
- Disclaimer about not being equipped for emergencies

## Role-Based Responses

### Patients
- Appointment booking and management
- General health information
- Medication reminders and safety
- Clinic finding assistance
- Preventive care tips

### Doctors
- Patient communication tips
- Medical reference information
- Scheduling guidance
- Clinical practice guidelines
- Documentation best practices

### Clinics
- Clinic management advice
- Patient scheduling optimization
- Staff coordination tips
- Healthcare regulations
- Patient experience improvement

## Integration with Backend

### Supabase Edge Functions
When available, the chatbot uses Supabase edge functions at:
```
{SUPABASE_URL}/functions/v1/chatbot
```

### Local Fallback
When edge functions are unavailable, the system uses:
- Pre-defined response patterns
- Keyword matching
- Role-specific response templates
- Emergency detection logic

## Styling and Theming

The chatbot uses TailwindCSS with a healthcare-themed color palette:
- Primary: Solid blue (`bg-blue-600`)
- Emergency: Red accents for emergency messages
- Success: Green for confirmation messages
- Neutral: Gray scale for general UI elements

## Accessibility

- Full keyboard navigation support
- Screen reader compatible
- High contrast colors
- Clear visual hierarchy
- Focus management

## Performance

- Efficient message rendering with virtual scrolling
- Debounced input handling
- Lazy loading of conversation history
- Optimized re-renders using React hooks

## Future Enhancements

- Voice input/output support
- Multi-language support (Filipino)
- Integration with electronic health records
- Video consultation scheduling
- Prescription management
- Real-time doctor handoff

## Security and Privacy

- No storage of sensitive medical information
- Secure Supabase integration with RLS policies
- Anonymous user support
- Clear data usage disclaimers
- HIPAA-compliant approach

## Testing

The chatbot includes comprehensive error handling for:
- Network connectivity issues
- API service unavailability
- Invalid user input
- Authentication failures
- Edge case scenarios

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Mobile Responsiveness

The chatbot is fully responsive and works on:
- iOS Safari
- Chrome Mobile
- Samsung Internet
- Firefox Mobile
