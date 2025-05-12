const Url = "http://localhost:3000";
import { handleLikeToggle } from "./utils/handleLikeToggle.ts";
import { createLikeButton } from "./utils/postRenderer.ts";

const LIKE_ICON = "/assets/heart.svg";

interface PostData {
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
}

document.addEventListener("DOMContentLoaded", async () => {
  const postContainer = document.getElementById(
    "single-post-content-area"
  ) as HTMLElement | null;
  const initialLoadingMessageElement = document.getElementById(
    "loading-single-post-message"
  );

  if (!postContainer) {
    console.error(
      "Single post content area (#single-post-content-area) not found!"
    );
    return;
  }

  const queryParams = new URLSearchParams(window.location.search);
  const postId = queryParams.get("id");

  if (!postId) {
    if (initialLoadingMessageElement) initialLoadingMessageElement.remove();
    postContainer.innerHTML = `<p class="text-red-500 font-semibold text-center py-10">No post ID provided in the URL.</p>`;
    return;
  }

  if (initialLoadingMessageElement) {
    postContainer.innerHTML = "";
    postContainer.appendChild(initialLoadingMessageElement);
    initialLoadingMessageElement.style.display = "block";
  } else {
    postContainer.innerHTML = `<p class="text-gray-500 text-center py-10">Loading post details...</p>`;
  }

  try {
    const response = await fetch(`${Url}/posts/${postId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const post: PostData = await response.json();

      postContainer.innerHTML = "";

      // Update page title
      document.title = `${post.title} - SelfScribe`;

      // Author Name
      if (post.authorUsername) {
        const authorElement = document.createElement("p");
        authorElement.className = "text-md text-gray-600 mb-2 italic";
        authorElement.textContent = `By: ${post.authorUsername}`;
        postContainer.appendChild(authorElement);
      }

      // Post Title
      const titleElement = document.createElement("h1");
      titleElement.className =
        "text-3xl sm:text-4xl font-bold text-violet-700 mb-4 break-words";
      titleElement.textContent = post.title;
      postContainer.appendChild(titleElement);

      // Post Content (Full Content)
      const contentElement = document.createElement("div");
      contentElement.className =
        "prose prose-lg max-w-none text-gray-800 leading-relaxed mt-6";
      post.content.split("\n").forEach((paragraphText) => {
        if (paragraphText.trim() !== "") {
          const p = document.createElement("p");
          p.textContent = paragraphText;
          contentElement.appendChild(p);
        }
      });
      postContainer.appendChild(contentElement);

      // Attachment Image
      if (post.attachmentPath) {
        const imageElement = document.createElement("img");
        imageElement.src = post.attachmentPath;
        imageElement.alt = post.title;
        imageElement.className =
          "my-6 rounded-lg shadow-md max-w-full h-auto md:max-w-xs lg:max-w-sm mx-auto";
        imageElement.onerror = () => {
          if (imageElement) imageElement.style.display = "none";
        };
        postContainer.appendChild(imageElement);
      }

      postContainer.appendChild(
        await createLikeButton(
          post.id,
          post.currentUserLiked == 1,
          post.likeCount
        )
      );

      // Meta Info (Date and Status)
      const metaInfo = document.createElement("div");
      metaInfo.className =
        "text-sm text-gray-500 my-6 pb-4 border-t border-gray-200";
      if (post.dateCreated) {
        const dateElement = document.createElement("p");
        dateElement.textContent = `Published: ${new Date(
          post.dateCreated
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`;
        metaInfo.appendChild(dateElement);
      }
      if (post.isPublished === 0) {
        // Check for draft status
        const statusElement = document.createElement("p");
        statusElement.textContent = "Status: Draft";
        statusElement.className = "text-yellow-600 font-medium";
        metaInfo.appendChild(statusElement);
      }
      postContainer.appendChild(metaInfo);
    } else {
      let errorMessage = "Could not load the post.";
      if (response.status === 404) {
        errorMessage = "Post not found.";
      } else if (response.status === 403) {
        errorMessage = "You are not authorized to view this post.";
      } else if (response.status === 401) {
        errorMessage = "Please log in to view this content.";
        window.location.href = "./login.html";
      } else {
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) errorMessage = errorData.message;
        } catch (e) {
          console.warn(
            "Could not parse server error response as JSON. Status:",
            response.status
          );
        }
      }
      postContainer.innerHTML = `<p class="text-red-500 font-semibold text-center py-10">${errorMessage}</p>`;
    }
  } catch (error) {
    console.error("Error fetching single post (network or other):", error);
    const currentLoadingMessage =
      postContainer.querySelector("#loading-single-post-message") ||
      postContainer.querySelector("p");
    if (currentLoadingMessage) currentLoadingMessage.remove();
    postContainer.innerHTML = `<p class="text-red-500 font-semibold text-center py-10">An error occurred while loading the post. Please check your connection.</p>`;
  }
});
