export type User = {
  id: number;
  username: string;
  email: string;
  password: string;
};

export type BlogPost = {
  userId: number;
  title: string;
  content: string;
  isPublished: boolean;
};
