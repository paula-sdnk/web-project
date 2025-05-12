import { fetchPosts, renderPosts } from "./utils/postRenderer.ts";

const Url = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", async () => {
  const postsContainer = document.getElementById("posts-container");

  if (!postsContainer) throw Error("postsContainer not found");

  const posts = await fetchPosts();

  if (posts) {
    renderPosts(posts, postsContainer);
  } else {
    postsContainer.innerHTML =
      '<p class="text-gray-600">Unable to load posts. Please try again later.</p>';
  }
});
