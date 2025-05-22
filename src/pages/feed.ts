import { renderPosts } from "./utils/postRenderer.ts";
import { tryCatch } from "./lib/lib.ts";
import type { PostData } from "./utils/postRenderer.ts";

const Url = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", async () => {
  const postsContainer = document.getElementById("posts-container");

  if (!postsContainer) throw Error("postsContainer not found");

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

  if (posts) {
    renderPosts(posts, postsContainer);
  } else {
    postsContainer.innerHTML =
      '<p class="text-gray-600">Unable to load posts. Please try again later.</p>';
  }
});
