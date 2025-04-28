# NTE Calendar and Event Management System

## Checkpoint - April 2025

This project is a calendar and event management system for a theater education organization. It allows managing calendars, events, halls, agreements, and users.

## Current State

The application is currently in a stable state after removing the hall layout editor functionality. This serves as a checkpoint for future development.

## Main Features

- **Calendar Management**: Create and manage multiple calendars with events
- **Event Management**: Track event status, assign users and cities
- **Hall Management**: Manage halls and their basic information
- **Agreement Management**: Create and manage agreements with schools
- **User Management**: Manage users with different roles and permissions

## Removed Features

The following features have been removed and will be rebuilt from scratch:
- Hall layout editor
- Seat assignment
- Ticket generation

## Technology Stack

- React with TypeScript
- Tailwind CSS for styling
- Supabase for database and authentication
- Lucide React for icons

## Development

To start the development server:

```bash
npm run dev
```

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