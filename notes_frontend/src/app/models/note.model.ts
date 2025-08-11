//
// PUBLIC_INTERFACE
// Note interface defines the structure of a note item used throughout the app.
//
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}
