import { tryCatch } from "../lib/lib.ts";
import { handleLikeToggle } from "./handleLikeToggle.ts";

const Url = "http://localhost:3000";
const LIKE_ICON = "/assets/heart.svg";

export type PostData = {
  id: string;
  title: string;
  content: string;
  isPublished?: number;
  dateCreated?: string;
  attachmentPath?: string | null;
  authorUsername: string;
  likeCount: number;
  currentUserLiked: number;
};

export async function fetchPosts() {
  const { data: response, error: fetchError } = await tryCatch(
    fetch(`${Url}/posts`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
  );

  if (fetchError) return;

  if (!response.ok) {
    console.error("Failed to fetch posts, Status:", response.status);
    if (response.status === 401) {
      console.log("Unauthorized. Redirecting to login.");
      window.location.href = "/login.html";
    }
    return;
  }

  const posts: PostData[] = await response.json();
  console.log("Fetched posts:", posts);
  return posts;
}

export const createLikeButton = async (
  postId: string,
  isLiked: boolean,
  likeCount: number
) => {
  console.log(postId, isLiked, likeCount);

  // Like section
  const likeSection = document.createElement("div");
  likeSection.className = "flex items-center mt-4 space-x-2";

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

export async function renderPosts(posts: PostData[], container: HTMLElement) {
  // Clear container
  container.innerHTML = "";

  if (!posts || posts.length === 0) {
    container.innerHTML =
      '<p class="text-gray-600">No blog posts to display.</p>';
    return;
  }

  for (const post of posts) {
    const postCard = document.createElement("div");
    postCard.className =
      "bg-white shadow-md rounded-lg p-6 mb-6 hover:shadow-lg transition-shadow duration-300";
    postCard.dataset.postId = post.id;

    // Author element
    const authorElement = document.createElement("p");
    authorElement.className = "text-sm text-gray-500 mb-1 italic pb-2";
    authorElement.textContent = `Author: ${post.authorUsername}`;
    postCard.appendChild(authorElement);

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
    textContentElement.className = "text-gray-700 mb-3 leading-relaxed";
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

    postCard.appendChild(
      await createLikeButton(
        post.id,
        post.currentUserLiked == 1,
        post.likeCount
      )
    );

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
