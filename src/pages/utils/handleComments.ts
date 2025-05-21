import { tryCatch } from "../../lib/lib.ts";

const Url = "http://localhost:3000";

export interface CommentData {
  id: number;
  userId: string;
  postId: string;
  content: string;
  createdAt: string;
  authorUsername: string;
  canDelete?: boolean;
}

export async function fetchComments(postId: string) {
  const { data: response, error: fetchError } = await tryCatch(
    fetch(`${Url}/comments/${postId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
  );

  if (fetchError) {
    console.error("Error fetching comments:", fetchError);
    return [];
  }

  if (!response.ok) {
    if (response.status === 401) {
      alert("Please log in to see comments");
      window.location.href = "/login.html";
    }
    console.error(`Failed to fetch comments: ${response.status}`);
    return [];
  }
  const comments = await response.json();
  return comments;
}

export async function postComment(postId: string, content: string) {
  const { data: response, error: fetchError } = await tryCatch(
    fetch(`${Url}/comments/create/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, content }),
    })
  );

  if (fetchError) {
    console.error("Error posting comment:", fetchError);
    return false;
  }

  if (!response.ok) {
    if (response.status === 401) {
      alert("Please log in to comment");
      window.location.href = "/login.html";
    }
    console.error(`Failed to post comment: ${response.status}`);
    return false;
  }

  return true;
}

async function deleteComment(commentId: number): Promise<boolean> {
  const { data: response, error: fetchError } = await tryCatch(
    fetch(`${Url}/comments/${commentId}`, {
      method: "DELETE",
    })
  );

  if (fetchError) {
    console.error("Error deleting comment:", fetchError);
    return false;
  }

  if (!response.ok) {
    console.error(`Failed to delete comment: ${response.status}`);
    if (response.status === 403) {
      alert("You are not authorized to delete this comment.");
    } else if (response.status === 404) {
      alert("Comment not found.");
    }
    try {
      const errorData = await response.json();
      console.error("Backend error message:", errorData.message);
      alert(errorData.message);
    } catch (e) {
      alert("Failed to delete comment.");
    }

    return false;
  }

  return true;
}

async function handleDeleteButtonClick(
  commentElement: HTMLElement,
  commentId: number,
  deleteButton: HTMLButtonElement
): Promise<void> {
  const isConfirmed = confirm("Are you sure you want to delete this comment?");

  if (isConfirmed) {
    deleteButton.disabled = true;
    deleteButton.textContent = "Deleting...";

    const success = await deleteComment(commentId);

    if (success) {
      commentElement.remove();

      const commentCountSpan = document.querySelector(".comment-count-display");
      if (commentCountSpan) {
        const currentCount = parseInt(commentCountSpan.textContent || "0");
        commentCountSpan.textContent = `${Math.max(0, currentCount - 1)}`;
      }
    } else {
      deleteButton.textContent = "Delete";
    }
  }
}

export function renderComments(
  comments: CommentData[],
  container: HTMLElement
) {
  container.innerHTML = "";

  if (!comments || comments.length === 0) {
    const noCommentsMsg = document.createElement("p");
    noCommentsMsg.className = "text-gray-500 text-center py-4";
    noCommentsMsg.textContent = "No comments yet. Be the first to comment!";
    container.appendChild(noCommentsMsg);
    return;
  }

  comments.forEach((comment) => {
    const commentElement = document.createElement("div");
    commentElement.className = "border-b border-gray-200 py-4 last:border-0";

    // Comment header with username and date
    const commentHeader = document.createElement("div");
    commentHeader.className = "flex justify-between items-center mb-2";

    const usernameElement = document.createElement("span");
    usernameElement.className = "font-medium text-violet-700";
    usernameElement.textContent = comment.authorUsername;
    commentHeader.appendChild(usernameElement);

    const dateElement = document.createElement("span");
    dateElement.className = "text-xs text-gray-500";
    const commentDate = new Date(comment.createdAt);
    dateElement.textContent = commentDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    commentHeader.appendChild(dateElement);

    commentElement.appendChild(commentHeader);

    const actionButtons = document.createElement("div");
    actionButtons.className = "flex items-center space-x-2";

    if (comment.canDelete) {
      const deleteButton = document.createElement("button");
      deleteButton.className =
        "text-gray-500 hover:text-red-500 focus:outline-none p-1 rounded-full";
      deleteButton.textContent = "Delete";

      deleteButton.addEventListener("click", async () => {
        await handleDeleteButtonClick(commentElement, comment.id, deleteButton);
      });

      actionButtons.appendChild(deleteButton);
    }

    if (actionButtons.hasChildNodes()) {
      commentHeader.appendChild(actionButtons);
    }

    commentElement.appendChild(commentHeader);

    // Comment content
    const contentElement = document.createElement("p");
    contentElement.className = "text-gray-700 whitespace-pre-line";
    contentElement.textContent = comment.content;
    commentElement.appendChild(contentElement);

    container.appendChild(commentElement);
  });
}

export function createCommentSection(postId: string) {
  const commentsSection = document.createElement("section");
  commentsSection.className =
    "max-w-3xl mx-auto bg-white p-6 sm:p-8 md:p-10 rounded-lg shadow-xl border-t border-gray-200 mb-6";

  // Comments header
  const commentsHeader = document.createElement("h2");
  commentsHeader.className = "text-2xl font-bold text-gray-800 mb-6";
  commentsHeader.textContent = "Comments";
  commentsSection.appendChild(commentsHeader);

  // Comment form
  const commentForm = document.createElement("form");
  commentForm.className = "mb-8";
  commentForm.id = "comment-form";

  const commentTextarea = document.createElement("textarea");
  commentTextarea.className =
    "w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-violet-500 resize-none";
  commentTextarea.rows = 3;
  commentTextarea.placeholder = "Write your comment...";
  commentTextarea.required = true;
  commentTextarea.id = "comment-content";
  commentForm.appendChild(commentTextarea);

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className =
    "mt-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 px-4 rounded transition duration-300";
  submitButton.textContent = "Send";
  commentForm.appendChild(submitButton);

  // Comments list container
  const commentsList = document.createElement("div");
  commentsList.className = "space-y-4";
  commentsList.id = "comments-list";

  const loadingComments = document.createElement("p");
  loadingComments.className = "text-gray-500 text-center py-4";
  loadingComments.textContent = "Loading comments...";
  commentsList.appendChild(loadingComments);

  commentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const commentContent = (commentTextarea.value || "").trim();
    if (!commentContent) return;

    submitButton.disabled = true;
    submitButton.textContent = "Posting...";

    const success = await postComment(postId, commentContent);

    if (success) {
      commentTextarea.value = "";

      // Refresh comments
      const comments = await fetchComments(postId);
      renderComments(comments, commentsList);

      // Update comment count if it exists
      const commentCountSpan = document.querySelector(".comment-count-display");
      if (commentCountSpan) {
        commentCountSpan.textContent = `${comments.length}`;
      }
    }

    submitButton.disabled = false;
    submitButton.textContent = "Send";
  });

  commentsSection.appendChild(commentForm);
  commentsSection.appendChild(commentsList);

  // Initialize comments
  fetchComments(postId).then((comments) => {
    renderComments(comments, commentsList);
  });

  return commentsSection;
}
