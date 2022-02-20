export interface User {
  id: string;
  name: string;
  avatar: string;
  room: string;
  host: boolean;
}
export interface Room {
  name: string;
  isPublic: boolean;
  members: User[];
}
