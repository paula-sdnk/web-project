export type User = {
  id: string;
  username: string;
  email: string;
  password: string;
};

export type BlogPost = {
  id: string;
  userId: string;
  title: string;
  content: string;
  isPublished: boolean;
};
