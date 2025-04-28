import { CalendarEvent } from './index';

// Extended type for calendar events with additional layout properties
export interface ExtendedCalendarEvent extends CalendarEvent {
  layout_blocks?: LayoutBlock[];
  hall_id?: string;
}

// Type for layout block data
export interface LayoutBlock {
  type: string;
  sections?: Record<string, any>;
  assignments?: Record<string, string>;
  schools?: string[];
} 