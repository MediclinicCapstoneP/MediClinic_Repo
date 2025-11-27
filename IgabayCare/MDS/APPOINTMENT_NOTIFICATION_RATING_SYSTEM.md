# Appointment Completion Notification & Rating System

## Overview

This document explains the implementation of the appointment completion notification and rating system for patients. When a patient's appointment is marked as "completed", they will receive a notification prompting them to rate their experience at the clinic.

## System Components

### 1. Database Schema

The system uses three new tables:

1. **notifications** - Stores all user notifications
2. **reviews** - Stores patient reviews and ratings
3. **notification_preferences** - Stores user notification preferences

### 2. Services

1. **NotificationService** - Manages notification creation, retrieval, and updates
2. **ReviewService** - Manages review creation, retrieval, and updates

### 3. UI Components

1. **AppointmentCompletionNotification** - Displays appointment completion notifications
2. **RatingModal** - Modal for patients to rate and review their appointments
3. **useNotifications** - React hook for managing notifications in components

## Implementation Details

### Database Setup

Run the SQL script at `database/appointment_notifications_and_reviews.sql` to create the necessary tables and functions.

Key features:
- Automatic notification creation when appointment status changes to "completed"
- Row Level Security (RLS) policies for data protection
- Indexes for performance optimization
- Triggers for automatic notification creation

### Notification Service

The NotificationService provides methods for:
- Creating notifications
- Retrieving notifications for a user
- Marking notifications as read
- Dismissing notifications
- Managing notification preferences

### Review Service

The ReviewService provides methods for:
- Creating and updating reviews
- Retrieving reviews for clinics or patients
- Checking if a patient can review an appointment
- Getting clinic rating summaries

## How It Works

### 1. Automatic Notification Creation

When an appointment status is updated to "completed":
1. A database trigger fires
2. The `trigger_appointment_completion_notification` function is called
3. This function creates a notification for the patient
4. The notification includes a "Rate Your Visit" action button

### 2. Patient Notification Display

Patients see notifications in their appointments dashboard:
- New notifications appear at the top with a blue indicator
- Unread notifications have a blue dot
- Notifications can be dismissed or marked as read
- Clicking "Rate Your Visit" opens the rating modal

### 3. Rating Process

When a patient rates an appointment:
1. They are prompted to provide star ratings (1-5) for:
   - Overall experience (required)
   - Staff friendliness (optional)
   - Cleanliness (optional)
   - Communication (optional)
   - Value for money (optional)
2. They can optionally write a review title and detailed review
3. They can choose to post anonymously
4. The review is saved to the database
5. The notification is automatically marked as read

## Testing the System

### Prerequisites

1. Database tables created (run `database/appointment_notifications_and_reviews.sql`)
2. Supabase project configured
3. Application running

### Test Steps

#### 1. Test Notification Creation

1. Log in as a clinic user
2. Navigate to the clinic appointments page
3. Find an appointment with status "confirmed" or "in_progress"
4. Change the appointment status to "completed"
5. Verify a notification is created for the patient

#### 2. Test Notification Display

1. Log in as the patient for whom the notification was created
2. Navigate to the "My Appointments" page
3. Verify the notification appears at the top of the page
4. Check that the notification shows:
   - Clinic name
   - Appointment date
   - "Rate Your Visit" button
   - Unread indicator

#### 3. Test Rating Process

1. As the patient, click the "Rate Your Visit" button in the notification
2. Verify the RatingModal opens
3. Provide ratings for the required and optional categories
4. Optionally add a review title and detailed review
5. Submit the review
6. Verify:
   - The review is saved to the database
   - The notification is marked as read
   - A success message is displayed

#### 4. Test Review Retrieval

1. As a clinic user, navigate to the clinic dashboard
2. Check that the new review appears in the reviews section
3. Verify the rating statistics are updated

### Test Data

#### Sample Appointment Update Query

```sql
-- Update an appointment to completed status to trigger notification
UPDATE appointments 
SET status = 'completed' 
WHERE id = 'your-appointment-id-here';
```

#### Sample Notification Check Query

```sql
-- Check if notification was created
SELECT * FROM notifications 
WHERE appointment_id = 'your-appointment-id-here' 
AND type = 'appointment_completed';
```

#### Sample Review Check Query

```sql
-- Check if review was created
SELECT * FROM reviews 
WHERE appointment_id = 'your-appointment-id-here';
```

## API Endpoints

### Notification Endpoints

- `GET /notifications` - Get notifications for current user
- `POST /notifications` - Create a new notification
- `PUT /notifications/{id}/read` - Mark notification as read
- `DELETE /notifications/{id}` - Dismiss notification

### Review Endpoints

- `GET /reviews` - Get reviews
- `POST /reviews` - Create a new review
- `PUT /reviews/{id}` - Update an existing review
- `GET /reviews/clinic/{id}` - Get reviews for a clinic
- `GET /reviews/patient/{id}` - Get reviews by a patient

## Error Handling

The system handles common errors:

1. **Database Connection Errors** - Retries with exponential backoff
2. **Permission Errors** - Validates user permissions before operations
3. **Validation Errors** - Ensures ratings are between 1-5 stars
4. **Duplicate Review Prevention** - Prevents multiple reviews for the same appointment

## Security Considerations

1. **Row Level Security** - Users can only access their own notifications and reviews
2. **Input Validation** - All user inputs are validated and sanitized
3. **Rate Limiting** - API endpoints have rate limiting to prevent abuse
4. **Data Encryption** - Sensitive data is encrypted at rest

## Performance Optimization

1. **Database Indexes** - Indexes on frequently queried columns
2. **Caching** - Review summaries are cached for quick retrieval
3. **Pagination** - Large result sets are paginated
4. **Real-time Updates** - Uses Supabase real-time subscriptions

## Future Enhancements

1. **Email Notifications** - Send email notifications for completed appointments
2. **SMS Notifications** - Send SMS notifications for completed appointments
3. **Review Moderation** - Add review moderation features
4. **Helpful Votes** - Allow users to vote on helpful reviews
5. **Clinic Responses** - Allow clinics to respond to reviews
6. **Review Analytics** - Provide detailed analytics for clinics

## Troubleshooting

### Common Issues

1. **Notifications Not Appearing**
   - Check if the appointment status was actually updated to "completed"
   - Verify the database trigger is working
   - Check the browser console for errors

2. **Rating Modal Not Opening**
   - Ensure the patient has the correct permissions
   - Check if the appointment is eligible for review
   - Verify the appointment ID is correct

3. **Reviews Not Saving**
   - Check database connection
   - Verify rating values are between 1-5
   - Check browser console for validation errors

### Debug Queries

```sql
-- Check notification preferences
SELECT * FROM notification_preferences WHERE user_id = 'user-id-here';

-- Check if review already exists
SELECT * FROM reviews WHERE appointment_id = 'appointment-id-here';

-- Check appointment status
SELECT id, status FROM appointments WHERE id = 'appointment-id-here';

-- Check notification creation function
SELECT create_appointment_completion_notification('appointment-id-here', 'user-id-here');
```

## Support

For issues with the notification and rating system, contact the development team with:
1. Screenshots of the issue
2. Browser console errors
3. Steps to reproduce
4. User IDs and appointment IDs involved