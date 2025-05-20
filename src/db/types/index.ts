export type User = {
  id: string;
  username: string;
  email: string;
  password: string;
  isAdmin: number;
};

export type BlogPost = {
  id: string;
  userId: string;
  title: string;
  content: string;
  isPublished: number;
  dateCreated: string;
  attachmentPath?: string | null;
  authorUsername: string;
  likeCount: number;
  currentUserLiked: number;
  commentCount: number;
};
