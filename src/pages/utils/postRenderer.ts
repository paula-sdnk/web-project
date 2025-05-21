import { tryCatch } from "../lib/lib.ts";
import { handleLikeToggle } from "./handleLikeToggle.ts";

const Url = "http://localhost:3000";
const LIKE_ICON = "/assets/heart.svg";
const COMMENT_ICON_URL = "/assets/comment.png";
const DOTS_ICON_URL = "/assets/dots_icon.png";

export type PostData = {
  id: string;
  title: string;
  content: string;
  isPublished: number;
  dateCreated: string;
  attachmentPath?: string | null;
  authorUsername: string;
  likeCount: number;
  currentUserLiked: number;
  commentCount: number;
  canDelete: boolean;
};

export const createLikeButton = async (
  postId: string,
  isLiked: boolean,
  likeCount: number
) => {
  console.log(postId, isLiked, likeCount);

  // Like section
  const likeSection = document.createElement("div");
  likeSection.className = "flex items-center mt-4 space-x-1";
  likeSection.dataset.postId = postId;

  // Like button
  const likeButton = document.createElement("button");
  likeButton.className = "flex items-center focus:outline-none";
  likeButton.dataset.postId = postId;
  likeButton.dataset.liked = isLiked ? "true" : "false";
  likeButton.addEventListener("click", handleLikeToggle);

  // like icon
  const { data: likeSvg, error: likeFetchError } = await tryCatch(
    fetch(LIKE_ICON)
  );

  if (likeFetchError || !likeSvg.ok) {
    throw Error("Cannot fetch svg");
  }

  const likeIconContainer = document.createElement("div");
  likeIconContainer.dataset.icon = "icon";
  likeIconContainer.className = `size-6 ${
    isLiked ? "text-pink-600" : "text-gray-900"
  }`;
  likeIconContainer.innerHTML = await likeSvg.text();

  // Like count
  const likeCountElement = document.createElement("span");
  likeCountElement.className = "like-count-display text-sm text-gray-600";
  likeCountElement.textContent = `${likeCount}`;

  likeButton.appendChild(likeIconContainer);
  likeSection.appendChild(likeButton);
  likeSection.appendChild(likeCountElement);

  return likeSection;
};

async function deletePostOnServer(postId: string) {
  const { data: response, error: fetchError } = await tryCatch(
    fetch(`${Url}/posts/${postId}`, {
      method: "DELETE",
    })
  );

  if (fetchError) {
    console.error("Error deleting post:", fetchError);
    return false;
  }

  if (!response.ok) {
    console.error(`Failed to delete post: ${response.status}`);
    if (response.status === 403) {
      alert("You are not authorized to delete this post.");
    } else if (response.status === 404) {
      alert("Post not found.");
    }
    try {
      const errorData = await response.json();
      console.error("Backend error message:", errorData.message);
      alert(errorData.message);
    } catch (e) {
      alert("Failed to delete post.");
    }

    return false;
  }

  return true;
}

async function handleDeletePostButtonClick(
  postElement: HTMLElement,
  postId: string,
  deleteButton: HTMLButtonElement
) {
  const isConfirmed = confirm("Are you sure you want to delete this post?");

  if (isConfirmed) {
    deleteButton.disabled = true;
    deleteButton.textContent = "Deleting...";

    const success = await deletePostOnServer(postId);

    if (success) {
      postElement.remove();
    } else {
      deleteButton.disabled = false;
      deleteButton.textContent = "Delete";
    }
  }
}

export async function renderPosts(posts: PostData[], container: HTMLElement) {
  container.innerHTML = "";

  if (!posts || posts.length === 0) {
    container.innerHTML =
      '<p class="text-gray-600">No blog posts to display.</p>';
    return;
  }

  for (const post of posts) {
    const postCard = document.createElement("div");
    postCard.className =
      "bg-white shadow-md rounded-lg p-6 mb-6 hover:shadow-lg transition-shadow duration-300 relative";
    postCard.dataset.postId = post.id;

    // Author element
    const authorElement = document.createElement("p");
    authorElement.className = "text-sm text-gray-500 mb-1 italic pb-2";
    authorElement.textContent = `Author: ${post.authorUsername}`;
    postCard.appendChild(authorElement);

    // Action menu
    const canShowActionMenu = post.canDelete || post.isPublished === 0;

    if (canShowActionMenu) {
      // Only create the action menu if there are potential actions
      const actionMenuContainer = document.createElement("div");
      actionMenuContainer.className = "absolute top-4 right-4 z-10";

      const dotsButton = document.createElement("button");
      dotsButton.className =
        "text-gray-500 hover:text-gray-700 focus:outline-none p-1 rounded-full";
      dotsButton.title = "More Actions";

      const dotsIconImg = document.createElement("img");
      dotsIconImg.className = "h-5 w-5";
      dotsIconImg.src = DOTS_ICON_URL;
      dotsIconImg.alt = "More actions icon";
      dotsButton.appendChild(dotsIconImg);

      const actionDropdown = document.createElement("div");
      actionDropdown.className =
        "hidden absolute right-0 mt-2 w-36 origin-top-right bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none";

      dotsButton.addEventListener("click", (event) => {
        event.stopPropagation();
        actionDropdown.classList.toggle("hidden");
      });

      document.addEventListener("click", (event) => {
        if (!actionMenuContainer.contains(event.target as Node)) {
          actionDropdown.classList.add("hidden");
        }
      });

      if (post.isPublished === 0) {
        const editButton = document.createElement("button");
        editButton.className =
          "block w-full text-left px-2 py-2 text-sm text-blue-700 hover:bg-gray-100";
        editButton.textContent = "Edit";
        editButton.title = "Edit Post";

        editButton.addEventListener("click", () => {
          actionDropdown.classList.add("hidden");
          window.location.href = `create-post.html?edit=${post.id}`;
        });
        actionDropdown.appendChild(editButton);
      }

      if (post.canDelete) {
        const deleteButton = document.createElement("button");
        deleteButton.className =
          "block w-full text-left px-2 py-2 text-sm text-red-700 hover:bg-gray-100";
        deleteButton.textContent = "Delete";
        deleteButton.title = "Delete Post";

        deleteButton.addEventListener("click", async () => {
          actionDropdown.classList.add("hidden");
          await handleDeletePostButtonClick(postCard, post.id, deleteButton);
        });

        actionDropdown.appendChild(deleteButton);
      }

      if (actionDropdown.hasChildNodes()) {
        actionMenuContainer.appendChild(dotsButton);
        actionMenuContainer.appendChild(actionDropdown);
        postCard.appendChild(actionMenuContainer);
      }
    }

    // Title element
    const titleElement = document.createElement("h3");
    titleElement.className = "text-xl font-semibold text-violet-700 mb-2";

    const titleLink = document.createElement("a");
    titleLink.href = `/view-post.html?id=${post.id}`;
    titleLink.textContent = post.title;
    titleElement.appendChild(titleLink);
    postCard.appendChild(titleElement);

    // Content element
    const textContentElement = document.createElement("p");
    textContentElement.className =
      "text-gray-700 mb-3 leading-relaxed whitespace-pre-wrap";
    const snippetLength = 200;
    const isTruncated = post.content.length > snippetLength;
    textContentElement.textContent = isTruncated
      ? post.content.substring(0, snippetLength) + "..."
      : post.content;
    postCard.appendChild(textContentElement);

    // Read more link
    if (isTruncated) {
      const readMoreLink = document.createElement("a");
      readMoreLink.href = `/view-post.html?id=${post.id}`;
      readMoreLink.textContent = "Read More";
      readMoreLink.className =
        "text-violet-600 hover:text-violet-800 hover:underline text-sm font-medium block mt-2";
      postCard.appendChild(readMoreLink);
    }

    // Image element
    if (post.attachmentPath) {
      const imageElement = document.createElement("img");
      imageElement.src = post.attachmentPath;
      imageElement.alt = post.title;
      imageElement.className =
        "mt-3 rounded-md shadow-sm max-w-full h-auto sm:max-w-[50%] md:max-w-[200px]";
      imageElement.onerror = () => {
        console.error(`Could not load image: ${post.attachmentPath}`);
        imageElement.style.display = "none";
      };
      postCard.appendChild(imageElement);
    }

    const engagementSection = document.createElement("div");
    engagementSection.className = "flex items-center space-x-4";

    // Likes element
    engagementSection.appendChild(
      await createLikeButton(
        post.id,
        post.currentUserLiked == 1,
        post.likeCount
      )
    );

    // Comments element
    const commentSection = document.createElement("div");
    commentSection.className = "flex items-center mt-4 space-x-1";

    const commentButtonLink = document.createElement("a");
    commentButtonLink.href = `/view-post.html?id=${post.id}`;
    commentButtonLink.className =
      "flex items-center focus:outline-none p-1 rounded-full hover:bg-gray-200 transition duration-150";

    const commentIconImg = document.createElement("img");
    commentIconImg.className = "h-5 w-5";
    commentIconImg.src = COMMENT_ICON_URL;
    commentIconImg.alt = "View comments";

    commentButtonLink.appendChild(commentIconImg);

    commentSection.appendChild(commentButtonLink);

    const commentCountSpan = document.createElement("span");
    commentCountSpan.className = "comment-count-display text-sm text-gray-600";
    commentCountSpan.textContent = `${post.commentCount || 0}`;
    commentSection.appendChild(commentCountSpan);

    engagementSection.appendChild(commentSection);
    postCard.appendChild(engagementSection);

    // Meta info
    const metaInfo = document.createElement("div");
    metaInfo.className = "text-xs text-gray-500 mt-3 border-t pt-2";
    if (post.dateCreated) {
      const dateElement = document.createElement("p");
      const postDate = new Date(post.dateCreated);
      dateElement.textContent = `Created: ${postDate.toLocaleDateString()}`;
      metaInfo.appendChild(dateElement);
    }

    if (post.isPublished !== undefined) {
      const publishedElement = document.createElement("p");
      const isActuallyPublished = Number(post.isPublished) === 1;
      publishedElement.textContent = isActuallyPublished
        ? "Status: Published"
        : "Status: Draft";
      publishedElement.className = isActuallyPublished
        ? "text-green-600 font-medium"
        : "text-yellow-600 font-medium";
      metaInfo.appendChild(publishedElement);
    }
    postCard.appendChild(metaInfo);
    container.appendChild(postCard);
  }
}
