# Application Checkpoint - April 2025

This file serves as a checkpoint for the application state as of April 2025. If anything goes wrong during development, you can return to this state.

## Current Application State

The application is a calendar and event management system for a theater education organization. It includes:

1. **Calendar Management**
   - Multiple calendars with events
   - Event status tracking
   - User assignment
   - City assignment

2. **Event Management**
   - Event details view
   - Performance tracking
   - Agreement management
   - School and teacher information

3. **Hall Management**
   - Basic hall information
   - City assignment
   - Address information

4. **User Management**
   - User roles (administrator, supervisor, organizator)
   - City assignments to users
   - Supervisor-organizer relationships

## Recently Removed Functionality

The hall layout editor functionality has been completely removed, including:
- Hall layout creation and editing
- Seat assignment
- Layout visualization
- Ticket generation

## Database Schema

The database schema includes the following main tables:
- `users` - User information and relationships
- `cities` - City information with coordinates
- `calendars` - Calendar definitions
- `calendar_events` - Events with status and assignments
- `halls` - Hall information linked to cities
- `agreements` - Agreements with schools
- `agreement_performances` - Performance details for agreements
- `show_titles` - Show titles available for performances
- `performance_types` - Types of performances

## Next Steps

This checkpoint can be used as a starting point for rebuilding the hall layout editor functionality from scratch.

## Recovery Instructions

If you need to return to this checkpoint:
1. Restore the database schema using the migrations up to this point
2. Ensure all removed files stay removed
3. Use the current file versions as the baseline

## Technical Notes

- The application uses React with TypeScript
- Styling is done with Tailwind CSS
- Database is Supabase (PostgreSQL)
- Authentication is handled through Supabase Auth