import { User } from '../types';

export const formatShortName = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length < 2) return name;

  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  return `${firstName.charAt(0)}. ${lastName}`;
};

export const getDisplayName = (user: User | undefined, currentUser: User | null): string => {
  if (!user) return '';
  return formatShortName(user.name);
};