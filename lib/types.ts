export type User = {
  id: string;
  name: string | null;
  email: string;
  password: string | null;
  emailVerified: Date | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}; 