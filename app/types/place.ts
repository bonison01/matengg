export interface Place {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  opening_hours?: string;
  description?: string;
  coordinates: [number, number]; // from latitude, longitude
  rating?: number;
  nearby_places?: string | string[] | null; // <-- Add this
}
